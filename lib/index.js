import z from '@deepseek-ai/schemastery';

// Use the host's Schemastery API (not Zod). The Client additionally checks
// identity uniqueness and rejects malformed/future layouts without rewriting them.
const Item = z.object({
  type: z.const('item').required(),
  id: z.string().min(1).max(256).required(),
});
const Group = z.object({
  type: z.const('group').required(),
  id: z.string().min(1).max(256).required(),
  name: z.string().min(1).max(120).required(),
  open: z.boolean().required(),
  children: z.array(Item).max(1000).required(),
});
const Layout = z.object({
  version: z.const(1).required(),
  roots: z.array(z.union([Item, Group])).max(1000).required(),
});
// Settings transport owns persistence, atomic writes and revision checks.
// No profile-file manipulation and no storage writes on installation.
export const Config = z.object({
  layout: Layout.default({ version: 1, roots: [] }).volatile(),
});
export function apply(ctx) {
  ctx.inject(['settings'], child => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber));
  });
}
