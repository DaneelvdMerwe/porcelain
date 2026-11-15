import * as assert from "node:assert";
import { openFirstWorkingChange } from "../../extension";
import type { RepoRegistry } from "../../git/repoRegistry";
import type { WorkingTreeFile } from "../../git/types";
import type { RequestContext } from "../../messages/protocol";

function registryWith(changes: WorkingTreeFile[] | null): RepoRegistry {
  const runtime = changes && {
    descriptor: { id: "repo-a", rootPath: "/repo-a" },
    paths: {},
    gitService: { getWorkingTreeChanges: async () => changes },
  };
  return { getActive: () => runtime } as unknown as RepoRegistry;
}

describe("openFirstWorkingChange", () => {
  it("opens the first working-tree change in the active repository", async () => {
    const opened: Array<{ repoId: string; filePath: string }> = [];
    const registry = registryWith([
      { path: "src/a.ts", staged: true, status: "modified" },
      { path: "src/b.ts", staged: false, status: "added" },
    ]);

    const result = await openFirstWorkingChange(
      registry,
      async (ctx: RequestContext, filePath: string) => {
        opened.push({ repoId: ctx.repoId, filePath });
      },
    );

    assert.strictEqual(result, true);
    assert.deepStrictEqual(opened, [
      { repoId: "repo-a", filePath: "src/a.ts" },
    ]);
  });

  it("opens nothing when the working tree is clean", async () => {
    let calls = 0;
    const result = await openFirstWorkingChange(registryWith([]), async () => {
      calls++;
    });
    assert.strictEqual(result, false);
    assert.strictEqual(calls, 0);
  });

  it("opens nothing when no repository is active", async () => {
    let calls = 0;
    const result = await openFirstWorkingChange(
      registryWith(null),
      async () => {
        calls++;
      },
    );
    assert.strictEqual(result, false);
    assert.strictEqual(calls, 0);
  });
});
