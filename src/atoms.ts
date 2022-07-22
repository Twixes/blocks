import { useCallback } from 'react'
import { atom, DefaultValue, selector, selectorFamily, useRecoilValue, useSetRecoilState } from 'recoil'
import {
    Page,
    Block,
    BlockId,
    BlockType,
    createBlankBlock,
    generateBlockId,
    determineBlockElementId,
} from './structure'

type BlocksLibrary = Record<BlockId, Block>

export const blocksLibraryState = atom<BlocksLibrary>({
    key: 'blocksLibraryState',
    default: {},
})

export const autoFocusedBlockIdState = atom<BlockId | null>({
    key: 'autoFocusedBlockState',
    default: null,
    effects: [
        ({ onSet }) =>
            onSet((newValue) => {
                if (newValue) {
                    document.getElementById(determineBlockElementId(newValue))?.focus()
                }
            }),
    ],
})

export const activePageState = atom<BlockId | null>({
    key: 'activePageState',
    default: null,
})

export const blockState = selectorFamily<Block | undefined, BlockId>({
    key: 'blockState',
    get:
        (blockId) =>
        ({ get }) => {
            const blocksLibrary = get(blocksLibraryState)
            return blocksLibrary[blockId]
        },
    set:
        (blockId) =>
        ({ get, set }, newBlock) => {
            const blocksLibrary = get(blocksLibraryState)
            const newBlocksLibrary = Object.assign({}, blocksLibrary)
            if (newBlock instanceof DefaultValue || newBlock === undefined) {
                const block = newBlocksLibrary[blockId]
                if (block !== undefined) {
                    if (block.parentId !== null) {
                        const newParentBlock = Object.assign({}, newBlocksLibrary[block.parentId])
                        if (newParentBlock.type !== BlockType.Page) {
                            throw new Error(`Parent block is not a page`)
                        }
                        newParentBlock.children = newParentBlock.children.filter((childId) => childId !== block.id)
                        newBlocksLibrary[block.parentId] = newParentBlock
                    }
                    delete newBlocksLibrary[blockId]
                }
            } else {
                newBlocksLibrary[blockId] = newBlock
            }
            set(blocksLibraryState, newBlocksLibrary)
        },
})

function deepCopyBlock(block: Block, libraryState: BlocksLibrary, libraryUpdate: BlocksLibrary): Block {
    const newBlock = Object.assign({}, block)
    newBlock.id = generateBlockId()
    libraryUpdate[newBlock.id] = newBlock
    if ('children' in newBlock) {
        newBlock.children = newBlock.children.map(
            (childId) => deepCopyBlock(libraryState[childId]!, libraryState, libraryUpdate).id
        )
    }
    return newBlock
}

function exportBlock(block: Block, libraryState: BlocksLibrary): string {
    let text = 'content' in block ? block.content : ''
    if ('children' in block) {
        text += '\n' + block.children.map((childId) => exportBlock(libraryState[childId]!, libraryState)).join('\n')
    }
    return text
}

export function useExportActivePage(): () => string | null {
    const blocksLibrary = useRecoilValue(blocksLibraryState)
    const activePage = useRecoilValue(activePageState)

    return useCallback(
        () => (activePage ? exportBlock(blocksLibrary[activePage]!, blocksLibrary) : null),
        [activePage, blocksLibrary]
    )
}

export function useAddBlock(pageId: BlockId): (blockType: BlockType, predecessorId: BlockId | undefined) => void {
    const setBlocksLibrary = useSetRecoilState(blocksLibraryState)
    const setAutoFocusedBlockId = useSetRecoilState(autoFocusedBlockIdState)

    return (blockType, predecessorId) => {
        if (!pageId) {
            return
        }
        const newBlock = createBlankBlock(blockType, pageId)
        setBlocksLibrary((state) => {
            const newParentBlock = Object.assign({}, state[pageId])
            if (newParentBlock.type !== BlockType.Page) {
                throw new Error(`Parent block is not a page`)
            }
            const newBlockIndex = predecessorId ? newParentBlock.children.indexOf(predecessorId) + 1 : 0
            const newParentChildren = newParentBlock.children.slice()
            newParentChildren.splice(newBlockIndex, 0, newBlock.id)
            return {
                ...state,
                [newBlock.id]: newBlock,
                [pageId]: { ...newParentBlock, children: newParentChildren } as Page,
            }
        })
        setAutoFocusedBlockId(newBlock.id)
    }
}

export function useDuplicateBlock(): (block: Block) => void {
    const setBlocksLibrary = useSetRecoilState(blocksLibraryState)

    return (block) => {
        setBlocksLibrary((state) => {
            const libraryUpdate: BlocksLibrary = {}
            const newBlock = deepCopyBlock(block, state, libraryUpdate)
            const newParentBlock = Object.assign({}, state[newBlock.parentId!])
            if (newParentBlock.type !== BlockType.Page) {
                throw new Error(`Parent block is not a page`)
            }
            const newBlockIndex = block.id ? newParentBlock.children.indexOf(block.id) + 1 : 0
            const newParentChildren = newParentBlock.children.slice()
            newParentChildren.splice(newBlockIndex, 0, newBlock.id)
            libraryUpdate[newBlock.parentId!] = { ...newParentBlock, children: newParentChildren }
            return Object.assign({}, state, libraryUpdate)
        })
    }
}

export function useMoveBlock(): (
    block: Block,
    newParentId: BlockId,
    predecessorId?: BlockId,
    putBefore?: boolean
) => void {
    const setBlocksLibrary = useSetRecoilState(blocksLibraryState)

    return (block, newParentId, predecessorId, putBefore = false) => {
        const previousParentId = block.parentId!
        setBlocksLibrary((state) => {
            const previousParent = Object.assign({}, state[previousParentId]) as Page
            previousParent.children = previousParent.children.filter((childId) => childId !== block.id)
            const newParent =
                previousParentId === newParentId ? previousParent : (Object.assign({}, state[newParentId]) as Page)
            if (newParent.type !== BlockType.Page) {
                throw new Error(`Parent block is not a page`)
            }
            let newBlockIndex = predecessorId ? newParent.children.indexOf(predecessorId) : 0
            if (!putBefore) {
                newBlockIndex++
            }
            newParent.children = newParent.children.slice()
            newParent.children.splice(newBlockIndex, 0, block.id)
            return {
                ...state,
                [block.id]: { ...block, parentId: newParentId },
                [previousParentId]: previousParent,
                [newParentId]: newParent,
            }
        })
    }
}

export const parentPagesState = selector<Page[]>({
    key: 'parentPagesState',
    get: ({ get }) => {
        const activePageBlockId = get(activePageState)
        if (!activePageBlockId) {
            return []
        }
        let currentBlock = get(blockState(activePageBlockId))
        const parentChain: Page[] = [currentBlock as Page]
        while (currentBlock?.parentId) {
            const { parentId } = currentBlock
            currentBlock = get(blockState(currentBlock.parentId!))
            if (!currentBlock) {
                throw new Error(`Parent block ${parentId} not found`)
            }
            if (currentBlock.type !== BlockType.Page) {
                throw new Error(`Parent block ${currentBlock.id} is not a page`)
            }
            parentChain.push(currentBlock)
        }
        return parentChain
    },
})

export function useCreateDocument(): () => void {
    const setActivePage = useSetRecoilState(activePageState)
    const setBlocksLibrary = useSetRecoilState(blocksLibraryState)

    return () => {
        const newDocument = createBlankBlock(BlockType.Page, null)
        setBlocksLibrary((state) => ({ ...state, [newDocument.id]: newDocument }))
        setActivePage(newDocument.id)
    }
}
