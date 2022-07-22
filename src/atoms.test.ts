import { snapshot_UNSTABLE } from 'recoil'
import { blocksLibraryState, blockState } from './atoms'
import { BlockType, createBlankBlock, generateBlockId } from './structure'

describe('blocks', () => {
    test('non-existent block is undefined', () => {
        const testPage = createBlankBlock(BlockType.Page, null)
        const testBlockState = blockState(testPage.id)

        const testSnapshot = snapshot_UNSTABLE()
        expect(testSnapshot.getLoadable(testBlockState).valueOrThrow()).toStrictEqual(undefined)
        expect(testSnapshot.getLoadable(blocksLibraryState).valueOrThrow()).toStrictEqual({})
    })

    test('block can be set', () => {
        const testBlock0 = createBlankBlock(BlockType.Paragraph, generateBlockId())
        const testBlockState = blockState(testBlock0.id)

        const testSnapshot0 = snapshot_UNSTABLE(({ set }) => set(testBlockState, testBlock0))
        expect(testSnapshot0.getLoadable(testBlockState).valueOrThrow()).toStrictEqual(testBlock0)
        expect(testSnapshot0.getLoadable(blocksLibraryState).valueOrThrow()).toStrictEqual({ [testBlock0.id]: testBlock0 })

        const testBlock1 = {...testBlock0, content: 'F'}
        const testSnapshot1 = testSnapshot0.map(({ set }) => set(testBlockState, testBlock1))
        expect(testSnapshot1.getLoadable(testBlockState).valueOrThrow()).toStrictEqual(testBlock1)
        expect(testSnapshot1.getLoadable(blocksLibraryState).valueOrThrow()).toStrictEqual({ [testBlock1.id]: testBlock1 })


        const testBlock2 = {...testBlock1, content: '3'}
        const testSnapshot2 = testSnapshot0.map(({ set }) => set(testBlockState, testBlock2))
        expect(testSnapshot2.getLoadable(testBlockState).valueOrThrow()).toStrictEqual(testBlock2)
        expect(testSnapshot2.getLoadable(blocksLibraryState).valueOrThrow()).toStrictEqual({ [testBlock2.id]: testBlock2 })
    })

    test('block can be removed', () => {
        const testBlock = createBlankBlock(BlockType.Page, null)
        const testBlockState = blockState(testBlock.id)
        const initialSnapshot = snapshot_UNSTABLE(({ set }) => set(testBlockState, testBlock))

        const testSnapshot = initialSnapshot.map(({ set }) => set(testBlockState, undefined))
        expect(testSnapshot.getLoadable(testBlockState).valueOrThrow()).toStrictEqual(undefined)
        expect(testSnapshot.getLoadable(blocksLibraryState).valueOrThrow()).toStrictEqual({})
    })

    test('block can be removed', () => {
        const testBlock = createBlankBlock(BlockType.Page, null)
        const testBlockState = blockState(testBlock.id)
        const initialSnapshot = snapshot_UNSTABLE(({ set }) => set(testBlockState, testBlock))

        const testSnapshot = initialSnapshot.map(({ set }) => set(testBlockState, undefined))
        expect(testSnapshot.getLoadable(testBlockState).valueOrThrow()).toStrictEqual(undefined)
        expect(testSnapshot.getLoadable(blocksLibraryState).valueOrThrow()).toStrictEqual({})
    })
})
