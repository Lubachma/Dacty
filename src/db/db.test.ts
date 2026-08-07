import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { db } from './db';

describe('schéma dexie', () => {
  it('est en version 2 avec les index de lecture sur runs', () => {
    expect(db.verno).toBe(2);
    const indexes = db.runs.schema.indexes.map((i) => i.name);
    expect(indexes).toEqual(expect.arrayContaining(['wpm', 'accuracy', 'chars']));
  });
});
