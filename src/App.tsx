import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import './App.css'
import { blockState, activePageState, useCreateDocument, usePageControls, parentPagesState } from './atoms'
import { Page, BlockId, BlockType, Paragraph } from './structure'

function PageBlock({ block }: { block: Page }): JSX.Element {
    const setActivePageBlockId = useSetRecoilState(activePageState)

    return (
        <button id={`block_${block.id}`} onClick={() => setActivePageBlockId(block.id)}>
            {block.title || <i>Untitled page</i>}
        </button>
    )
}

function ParagraphBlock({ block }: { block: Paragraph }): JSX.Element {
    const setBlock = useSetRecoilState(blockState(block.id))

    return (
        <input
            id={`block_${block.id}`}
            type="text"
            value={block.content}
            onChange={(e) => setBlock({ ...block, content: e.target.value })}
            onKeyDown={(e) => {
                if (e.key === 'Backspace') {
                    setBlock(undefined)
                }
            }}
            placeholder="Enter some text"
        />
    )
}

function BlockSubview({ blockId }: { blockId: BlockId }): JSX.Element | null {
    const block = useRecoilValue(blockState(blockId))

    return block ? 'children' in block ? <PageBlock block={block} /> : <ParagraphBlock block={block} /> : <>?</>
}

function AddBlockRow({ pageId, predecessorId }: { pageId: BlockId; predecessorId: BlockId | undefined }): JSX.Element {
    const { addBlock } = usePageControls(pageId)

    return (
        <div className="AddBlockRow">
            <button onClick={() => addBlock(BlockType.Paragraph, predecessorId)}>Add Paragraph</button>
            <button onClick={() => addBlock(BlockType.Page, predecessorId)}>Add Page</button>
        </div>
    )
}

function Breadcrumbs(): JSX.Element | null {
    const parentPages = useRecoilValue(parentPagesState)
    const setActivePageBlockId = useSetRecoilState(activePageState)

    return parentPages.length ? (
        <div className="Breadcrumbs">
            {parentPages.map((page) => (
                <a key={page.id} onClick={() => setActivePageBlockId(page.id)}>
                    {page.title || <i>Untitled page</i>}
                </a>
            ))}
        </div>
    ) : null
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
                value={page.title}
                onChange={(e) => {
                    setPage({ ...page, title: e.target.value })
                }}
                placeholder="Name your page"
                style={{ fontWeight: 700 }}
            />
            {page.children.map((childId) => (
                <BlockSubview key={childId} blockId={childId} />
            ))}
            <AddBlockRow pageId={blockId} predecessorId={page.children[page.children.length - 1]} />
        </div>
    )
}

function App(): JSX.Element {
    const activePageBlockId = useRecoilValue(activePageState)

    const createDocument = useCreateDocument()

    return (
        <div className="App">
            <h1>Welcome to Blocks!</h1>
            {!activePageBlockId ? (
                <button onClick={createDocument}>Create Document</button>
            ) : (
                <PageView blockId={activePageBlockId} />
            )}
        </div>
    )
}

export default App
