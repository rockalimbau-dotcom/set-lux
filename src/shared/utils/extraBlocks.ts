import { AnyRecord } from '@shared/types/common';

export type ExtraBlock = {
  id: string;
  tipo: string;
  start: string;
  end: string;
  list: AnyRecord[];
  text: string;
};

const createBlockId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeList = (value: unknown): AnyRecord[] =>
  Array.isArray(value)
    ? value.filter(Boolean).map(item => ({ ...(item as AnyRecord) }))
    : [];

const normalizeBlock = (block: AnyRecord, index: number): ExtraBlock => ({
  id: String(block?.id || `extra_${index}_${createBlockId()}`),
  tipo: String(block?.tipo || ''),
  start: String(block?.start || ''),
  end: String(block?.end || ''),
  list: normalizeList(block?.list),
  text: String(block?.text || ''),
});

const blockHasContent = (block: Partial<ExtraBlock> | null | undefined): boolean => {
  if (!block) return false;
  return (
    String(block.tipo || '').trim() !== '' ||
    String(block.start || '').trim() !== '' ||
    String(block.end || '').trim() !== '' ||
    String(block.text || '').trim() !== '' ||
    normalizeList(block.list).length > 0
  );
};

export const flattenExtraBlockMembers = (blocks: ExtraBlock[]): AnyRecord[] => {
  const seen = new Set<string>();
  const out: AnyRecord[] = [];
  (blocks || []).forEach(block => {
    normalizeList(block.list).forEach(member => {
      const role = String(member?.role || '').trim().toUpperCase();
      const name = String(member?.name || '').trim();
      const originalSource = String(member?.source || '').trim() || 'ref';
      const source = 'ref';
      const key = `${role}::${name}::${source}`;
      if (!role && !name) return;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ ...member, role, name, source, originalSource });
    });
  });
  return out;
};

export const normalizeExtraBlocks = (day: AnyRecord | null | undefined): ExtraBlock[] => {
  const rawBlocks = Array.isArray(day?.refBlocks) ? day.refBlocks : [];
  if (rawBlocks.length > 0) {
    return rawBlocks.map((block: AnyRecord, index: number) => normalizeBlock(block, index));
  }

  const legacyBlock: Partial<ExtraBlock> = {
    id: createBlockId(),
    tipo: String(day?.refTipo || ''),
    start: String(day?.refStart || ''),
    end: String(day?.refEnd || ''),
    list: normalizeList(day?.refList),
    text: String(day?.refTxt || ''),
  };

  return blockHasContent(legacyBlock)
    ? [
        {
          id: String(legacyBlock.id),
          tipo: String(legacyBlock.tipo || ''),
          start: String(legacyBlock.start || ''),
          end: String(legacyBlock.end || ''),
          list: normalizeList(legacyBlock.list),
          text: String(legacyBlock.text || ''),
        },
      ]
    : [];
};

export const applyExtraBlocksToDay = (
  day: AnyRecord | null | undefined,
  inputBlocks: ExtraBlock[]
): AnyRecord => {
  const blocks = (inputBlocks || []).map((block, index) => normalizeBlock(block as AnyRecord, index));
  const firstBlock = blocks.find(blockHasContent) || blocks[0];

  return {
    ...(day || {}),
    refBlocks: blocks,
    refList: flattenExtraBlockMembers(blocks),
    refTxt: firstBlock?.text || '',
    refTipo: firstBlock?.tipo || '',
    refStart: firstBlock?.start || '',
    refEnd: firstBlock?.end || '',
  };
};

export const dayHasExtraBlocks = (day: AnyRecord | null | undefined): boolean =>
  normalizeExtraBlocks(day).length > 0;
