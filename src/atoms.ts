import { atom, DefaultValue, selector, selectorFamily, useSetRecoilState } from 'recoil'
import { Page, Block, BlockId, BlockType, createBlankBlock } from './structure'

const blocksLibraryState = atom<Record<BlockId, Block>>({
    key: 'blocksLibraryState',
    default: {},
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
                        delete newBlocksLibrary[blockId]
                    }
                }
            } else {
                newBlocksLibrary[blockId] = newBlock
            }
            set(blocksLibraryState, newBlocksLibrary)
        },
})

export function usePageControls(pageId: BlockId): {
    addBlock: (blockType: BlockType, predecessorId: BlockId | undefined) => void
} {
    const setBlocksLibrary = useSetRecoilState(blocksLibraryState)

    return {
        addBlock: (blockType, predecessorId) => {
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
        },
    }
}

export const parentPagesState = selector<Page[]>({
    key: 'parentPagesState',
    get: ({ get }) => {
        const blockId = get(activePageState)
        const parentChain: Page[] = []
        if (blockId) {
            let currentBlock = get(blockState(blockId))
            while (currentBlock?.parentId) {
                const { parentId } = currentBlock
                currentBlock = get(blockState(parentId))
                if (!currentBlock) {
                    throw new Error(`Parent block ${parentId} not found`)
                }
                if (currentBlock.type !== BlockType.Page) {
                    throw new Error(`Parent block ${currentBlock.id} is not a page`)
                }
                parentChain.push(currentBlock)
            }
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
