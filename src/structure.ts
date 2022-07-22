export type BlockId = string

export enum BlockType {
    Page = 'page',
    Paragraph = 'paragraph',
}

interface BlockBase {
    id: BlockId
    parentId: BlockId | null
    type: BlockType
    content: string
}

export interface Paragraph extends BlockBase {
    parentId: BlockId
    type: BlockType.Paragraph
}

export interface Page extends BlockBase {
    children: BlockId[]
    createdAt: Date
    type: BlockType.Page
}

export type Block = Paragraph | Page

/** Generates random alphanumeric string. No collision checks for simplicity. */
export const generateBlockId = (): BlockId => Math.random().toString(36).slice(2)

export function createBlankBlock(type: BlockType.Paragraph, parentId: BlockId): Paragraph
export function createBlankBlock(type: BlockType.Paragraph, parentId: null): never
export function createBlankBlock(type: BlockType.Page, parentId: BlockId | null): Page
export function createBlankBlock(type: BlockType, parentId: BlockId | null): Block
export function createBlankBlock(type: BlockType, parentId: BlockId | null): Block {
    const id = generateBlockId()
    switch (type) {
        case BlockType.Paragraph:
            return {
                id,
                parentId: parentId!,
                content: '',
                type: BlockType.Paragraph,
            }
        case BlockType.Page:
            return {
                id,
                parentId,
                content: '',
                children: [],
                createdAt: new Date(),
                type: BlockType.Page,
            }
        default:
            throw new Error(`Unknown block type ${type}`)
    }
}

export const determineBlockElementId = (block: BlockId) => `block-${block}`
