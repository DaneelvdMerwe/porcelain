import * as assert from "node:assert";
import type { RepoRegistry } from "../../git/repoRegistry";
import type { WorkingTreeFile } from "../../git/types";
import {
  DiffEditorManager,
  type WorkingTreeStep,
  workingTreeSteps,
} from "../../views/diffEditorManager";
import { DiffWindow } from "../../views/diffWindow";

function change(path: string, staged: boolean): WorkingTreeFile {
  return { path, staged, status: "modified" };
}

describe("workingTreeSteps: the list a working-tree diff steps through", () => {
  const changes = [
    change("a.ts", true),
    change("a.ts", false),
    change("b.ts", false),
  ];

  it("lists each path once for the whole change against HEAD", () => {
    // The Commit panel sends no side: a staged-and-modified file is one diff.
    assert.deepStrictEqual(workingTreeSteps(changes, undefined), [
      { path: "a.ts" },
      { path: "b.ts" },
    ]);
  });

  it("keeps every row, with its side, when a side was asked for", () => {
    assert.deepStrictEqual(workingTreeSteps(changes, false), [
      { path: "a.ts", staged: true },
      { path: "a.ts", staged: false },
      { path: "b.ts", staged: false },
    ]);
  });
});

describe("DiffEditorManager: stepping a working-tree file list", () => {
  const steps: WorkingTreeStep[] = [
    { path: "a.ts" },
    { path: "b.ts" },
    { path: "c.ts" },
  ];
  let opened: string[];
  let manager: DiffEditorManager;

  beforeEach(() => {
    opened = [];
    const registry = { get: () => undefined } as unknown as RepoRegistry;
    manager = new DiffEditorManager(registry, new DiffWindow());
  });

  function listFrom(index: number): void {
    manager.setWorkingTreeFileList(steps, index, async (step) => {
      opened.push(step.path);
    });
  }

  it("opens the next and previous file of the list", async () => {
    listFrom(1);
    assert.strictEqual(await manager.nextDiff(), true);
    assert.strictEqual(await manager.prevDiff(), true);
    assert.deepStrictEqual(opened, ["c.ts", "b.ts"]);
  });

  it("stays on the last or first file instead of reopening it", async () => {
    listFrom(2);
    assert.strictEqual(await manager.nextDiff(), true);
    listFrom(0);
    assert.strictEqual(await manager.prevDiff(), true);
    assert.deepStrictEqual(opened, []);
  });

  it("drops the list when a commit's file list takes over", async () => {
    listFrom(0);
    manager.setDiffFileList("repo", [], "abc123");
    assert.strictEqual(await manager.nextDiff(), false);
    assert.deepStrictEqual(opened, []);
  });

  it("drops the list when a commit diff opens", async () => {
    // The registry knows no repo, so the open fails after it has cleared
    // the working-tree list: the list must not step the commit diff's panel.
    listFrom(0);
    await assert.rejects(manager.openDiffEditor("repo", "abc123", "a.ts"));
    assert.strictEqual(await manager.nextDiff(), false);
    assert.deepStrictEqual(opened, []);
  });

  it("reports no list when nothing was opened from the working tree", async () => {
    assert.strictEqual(await manager.nextDiff(), false);
    assert.strictEqual(await manager.prevDiff(), false);
  });
});
