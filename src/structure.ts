export type BlockId = string

export enum BlockType {
    Page = 'page',
    Paragraph = 'paragraph',
}

interface BlockBase {
    id: BlockId
    parentId: BlockId | null
    type: BlockType
}

export interface Paragraph extends BlockBase {
    content: string
    type: BlockType.Paragraph
}

export interface Page extends BlockBase {
    title: string
    children: BlockId[]
    createdAt: Date
    type: BlockType.Page
}

export type Block = Paragraph | Page

export const generateBlockId = (): BlockId => Math.random().toString(36).slice(2)

export function createBlankBlock(type: BlockType.Paragraph, parentId: BlockId | null): Paragraph
export function createBlankBlock(type: BlockType.Page, parentId: BlockId | null): Page
export function createBlankBlock(type: BlockType, parentId: BlockId | null): Block
export function createBlankBlock(type: BlockType, parentId: BlockId | null): Block {
    const id = generateBlockId()
    switch (type) {
        case BlockType.Paragraph:
            return {
                id,
                parentId,
                content: '',
                type: BlockType.Paragraph,
            }
        case BlockType.Page:
            return {
                id,
                parentId,
                title: '',
                children: [],
                createdAt: new Date(),
                type: BlockType.Page,
            }
        default:
            throw new Error(`Unknown block type ${type}`)
    }
}
