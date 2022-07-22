import { useState } from 'react'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import './App.css'
import {
    blockState,
    activePageState,
    useCreateDocument,
    parentPagesState,
    useExportActivePage,
    useDuplicateBlock,
    useAddBlock,
    useMoveBlock,
} from './lib/atoms'
import { Page, BlockId, BlockType, Paragraph, determineBlockElementId } from './lib/structure'

function PageBlock({ block }: { block: Page }): JSX.Element {
    const setActivePageBlockId = useSetRecoilState(activePageState)

    return (
        <button id={determineBlockElementId(block.id)} onClick={() => setActivePageBlockId(block.id)}>
            {block.content || <i>Untitled page</i>}
        </button>
    )
}

function ParagraphBlock({ block }: { block: Paragraph }): JSX.Element {
    const setBlock = useSetRecoilState(blockState(block.id))
    const addBlock = useAddBlock(block.parentId)

    return (
        <input
            id={determineBlockElementId(block.id)}
            type="text"
            value={block.content}
            onChange={(e) => setBlock({ ...block, content: e.target.value })}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    addBlock(BlockType.Paragraph, block.id)
                } else if (block.content.length === 0 && e.key === 'Backspace') {
                    setBlock(undefined)
                }
            }}
            placeholder="Enter some text"
        />
    )
}

function BlockSubview({
    pageId,
    blockId,
    predecessorId,
    successorId,
}: {
    pageId: BlockId
    blockId: BlockId
    predecessorId: BlockId | undefined
    successorId: BlockId | undefined
}): JSX.Element | null {
    const [block, setBlock] = useRecoilState(blockState(blockId))
    const duplicateBlock = useDuplicateBlock()
    const moveBlock = useMoveBlock()

    if (!block) {
        return <>???</>
    }

    const content = 'children' in block ? <PageBlock block={block} /> : <ParagraphBlock block={block} />

    return (
        <div className="BlockSubview">
            {content}
            <button className="BlockSubview__control" onClick={predecessorId ? (() => moveBlock(block, pageId, predecessorId, true)) : undefined} disabled={!predecessorId}>
                <img src="/arrow_upward_black_24dp.svg" />
            </button>
            <button className="BlockSubview__control" onClick={successorId ? (() => moveBlock(block, pageId, successorId)) : undefined} disabled={!successorId}>
                <img src="/arrow_downward_black_24dp.svg" />
            </button>
            <button className="BlockSubview__control" onClick={() => setBlock(undefined)}>
                <img src="/clear_black_24dp.svg" />
            </button>
            <button className="BlockSubview__control" onClick={() => duplicateBlock(block)}>
                <img src="/content_copy_black_24dp.svg" />
            </button>
        </div>
    )
}

function AddBlockRow({ pageId, predecessorId }: { pageId: BlockId; predecessorId: BlockId | undefined }): JSX.Element {
    const addBlock = useAddBlock(pageId)

    return (
        <div className="AddBlockRow">
            <button onClick={() => addBlock(BlockType.Paragraph, predecessorId)}>Add Paragraph</button>
            <button onClick={() => addBlock(BlockType.Page, predecessorId)}>Add Page</button>
        </div>
    )
}

function Breadcrumb({ page, active = false }: { page: Page; active?: boolean }): JSX.Element {
    const setActivePageBlockId = useSetRecoilState(activePageState)

    const content = page.content || <i>Untitled page</i>

    return !active ? (
        <a className="Breadcrumb" key={page.id} onClick={() => setActivePageBlockId(page.id)}>
            {content}
        </a>
    ) : (
        <span className="Breadcrumb">{content}</span>
    )
}

function Breadcrumbs(): JSX.Element | null {
    const parentPages = useRecoilValue(parentPagesState)

    return (
        <div className="Breadcrumbs">
            {parentPages
                .slice(1)
                .reverse()
                .map((page) => (
                    <>
                        <Breadcrumb key={page.id} page={page} />
                        {' > '}
                    </>
                ))}
            <Breadcrumb page={parentPages[0]!} active />
        </div>
    )
}

function ExportDocumentButton(): JSX.Element {
    const exportActivePage = useExportActivePage()

    const [hasExported, setHasExported] = useState(false)

    return (
        <button
            onClick={() => {
                const activePageText = exportActivePage()
                if (activePageText && navigator.clipboard) {
                    navigator.clipboard.writeText(activePageText)
                    setHasExported(true)
                }
            }}
        >
            {!hasExported ? 'Export Document' : 'Copied to Clipboard'}
        </button>
    )
}

function CreateDocumentButton(): JSX.Element {
    const createDocument = useCreateDocument()

    return <button onClick={createDocument}>Create Document</button>
}

function PageView({ blockId }: { blockId: BlockId }): JSX.Element {
    const [page, setPage] = useRecoilState(blockState(blockId)) as [Page, (page: Page) => void]

    if (!page) {
        throw new Error('Page not found')
    }

    return (
        <div className="PageView">
            <Breadcrumbs />
            <input
                type="text"
                value={page.content}
                onChange={(e) => {
                    setPage({ ...page, content: e.target.value })
                }}
                placeholder="Untitled page"
                style={{ fontWeight: 700 }}
            />
            {page.children.map((childId, index) => (
                <BlockSubview
                    key={childId}
                    pageId={blockId}
                    blockId={childId}
                    predecessorId={page.children[index - 1]}
                    successorId={page.children[index + 1]}
                />
            ))}
            <AddBlockRow pageId={blockId} predecessorId={page.children[page.children.length - 1]} />
            <ExportDocumentButton />
        </div>
    )
}

function App(): JSX.Element {
    const activePageBlockId = useRecoilValue(activePageState)

    return (
        <div className="App">
            <h1>Welcome to Blocks!</h1>
            {!activePageBlockId ? <CreateDocumentButton /> : <PageView blockId={activePageBlockId} />}
        </div>
    )
}

export default App
