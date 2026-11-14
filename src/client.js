/* Generated from this entry and dependency-free helper modules by build.mjs. */
window.__ModuleLoader__.load({
  id: '@local/dsh-settings-sidebar-organizer',
  factory(require) {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const h = React.createElement;
    /* __ORGANIZER_MODEL__ */
    /* __ORGANIZER_PERSISTENCE__ */
    /* __ORGANIZER_ATTACHMENT__ */
    /* __ORGANIZER_DRAG__ */
    /* __ORGANIZER_POPOVER__ */
    const NS = 'settings-sidebar-organizer';
    const dictionaries = {
      zh: {
        organize: '整理侧栏', help: '拖动入口调整顺序；停在正中心创建分组。分组最多两层。',
        before: '移到上方', after: '移到下方', create: '创建分组', join: '移入分组',
        newGroup: '新分组', dissolve: '解散分组', root: '移到一级',
        reset: '恢复默认布局', confirmReset: '确认恢复默认？', close: '关闭', saved: '已保存到 Desktop 配置',
        saving: '正在保存…', failed: '保存失败，已恢复已保存布局。请重试。',
        loading: '正在读取布局…', readonly: '布局当前不可写', ready: '布局已读取；操作后会自动保存',
        waitingOwner: '正在等待原生设置入口注册…', registered: '导航接管已注册，正在检查设置导航…',
        attached: '拖拽整理已就绪，可直接拖动左侧入口', attachError: '导航接管失败，已保留原生导航',
        unsupported: '当前设置导航结构尚未适配，已保留原生导航。',
        saveName: '保存名称', groupName: '分组名称', emptyName: '请输入分组名称',
        cancel: '取消', menu: '分组操作',
        dragging: '正在拖动，尚未保存；边缘或间隙用于排序，正中心用于分组。',
        dropCancelled: '本次拖动已取消或落点无效，没有更改布局。', noChange: '位置未改变，无需保存。',
      },
      en: {
        organize: 'Organize sidebar', help: 'Drag to reorder. Drop in the center to create a group. Two levels maximum.',
        before: 'Move above', after: 'Move below', create: 'Create group', join: 'Move into group',
        newGroup: 'New group', dissolve: 'Dissolve group', root: 'Move to root',
        reset: 'Reset layout', confirmReset: 'Confirm reset?', close: 'Close', saved: 'Saved to host settings',
        saving: 'Saving…', failed: 'Save failed. Saved layout restored. Please try again.',
        loading: 'Loading layout…', readonly: 'Layout is read-only', ready: 'Layout loaded; changes save automatically',
        waitingOwner: 'Waiting for the native settings entry…', registered: 'Navigation attachment registered; checking the panel…',
        attached: 'Drag to organize the entries directly', attachError: 'Navigation attachment failed; native navigation preserved',
        unsupported: 'This navigation structure is not supported; native navigation preserved.',
        saveName: 'Save name', groupName: 'Group name', emptyName: 'Enter a group name',
        cancel: 'Cancel', menu: 'Group actions',
        dragging: 'Dragging, not saved yet. Use an edge or gap to reorder; the center groups entries.',
        dropCancelled: 'Drag cancelled or invalid drop target. Layout unchanged.', noChange: 'Position unchanged; no save needed.',
      },
    };
    const css = `
      .dso-list{position:relative}
      .dso-row{position:relative;min-width:0}
      .dso-row>button{width:100%;position:relative;touch-action:pan-y}
      .dso-row [draggable=true]{cursor:grab}
      .dso-row [draggable=true]:active{cursor:grabbing}
      .dso-row[data-source=true]{opacity:.45}
      .dso-gap{display:none;position:relative;box-sizing:border-box;overflow:hidden;align-items:center;justify-content:center;transition:block-size 160ms ease,inline-size 160ms ease,flex-basis 160ms ease}
      [data-dragging=true]>.dso-gap[data-hover=true]{display:flex;flex:0 0 24px;block-size:24px;inline-size:100%;animation:dso-gap-enter-y 160ms ease both}
      @keyframes dso-gap-enter-y{from{block-size:0;flex-basis:0}to{block-size:24px;flex-basis:24px}}
      @keyframes dso-gap-enter-x{from{inline-size:0;flex-basis:0}to{inline-size:24px;flex-basis:24px}}
      .dso-gap-line{display:block;inline-size:calc(100% - 12px);block-size:2px;border-radius:2px;opacity:0;transform:scaleX(.65);background:var(--dsw-alias-brand-primary);pointer-events:none;transition:opacity 130ms ease,transform 160ms ease}
      .dso-gap[data-hover=true]>.dso-gap-line{opacity:1;transform:scaleX(1)}
      .dso-list[data-axis=x]>.dso-gap{inline-size:8px;block-size:auto;min-block-size:0;min-inline-size:8px;align-self:stretch}
      .dso-list[data-axis=x]>.dso-gap[data-hover=true]{inline-size:24px;flex-basis:24px;animation-name:dso-gap-enter-x}
      .dso-list[data-axis=x]>.dso-gap>.dso-gap-line{inline-size:2px;block-size:24px;transform:scaleY(.65)}
      .dso-list[data-axis=x]>.dso-gap[data-hover=true]>.dso-gap-line{transform:scaleY(1)}
      .dso-list[data-axis=x]>[data-dso-root=true]{flex-shrink:0}
      .dso-row[data-zone=center]>button{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-brand-primary) 50%,transparent)}
      .dso-label{position:relative;display:grid;min-width:0;flex:1;text-align:start;overflow:hidden}
      .dso-label>.dso-original,.dso-label>.dso-hint{grid-area:1/1;transition:opacity 130ms ease,transform 180ms cubic-bezier(.2,.8,.2,1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .dso-hint{opacity:0;transform:translateY(8px);color:var(--dsw-alias-brand-primary);font-size:12px;pointer-events:none}
      .dso-label[data-hint=true]>.dso-original{opacity:0;transform:translateY(-8px)}
      .dso-label[data-hint=true]>.dso-hint{opacity:1;transform:translateY(0)}
      .dso-label[data-direction=before] .dso-hint>span{animation:dso-up 900ms ease-in-out infinite;animation-delay:calc(var(--i)*26ms)}
      .dso-label[data-direction=after] .dso-hint>span{animation:dso-down 900ms ease-in-out infinite;animation-delay:calc(var(--i)*26ms)}
      .dso-label[data-direction=center] .dso-hint>span{animation:dso-gather 900ms ease-in-out infinite;animation-delay:calc(var(--i)*26ms)}
      .dso-hint>span{display:inline-block;white-space:pre}
      @keyframes dso-up{0%,100%{transform:translateY(0)}45%{transform:translateY(-2px)}}
      @keyframes dso-down{0%,100%{transform:translateY(0)}45%{transform:translateY(2px)}}
      @keyframes dso-gather{0%,100%{transform:scale(1)}45%{transform:scale(.93);opacity:.6}}
      .dso-group{position:relative;min-width:0}
      .dso-group-head{display:flex;align-items:center;gap:2px;position:relative}
      .dso-group-head>.dso-row{flex:1;min-width:0}
      .dso-group-head .dso-count{font-size:11px;color:var(--dsw-alias-label-secondary);margin-inline-start:auto}
      .dso-children{margin-inline-start:13px;padding-inline-start:9px;border-inline-start:1px solid var(--dsw-alias-border-l1);display:grid;gap:4px;margin-block:4px 6px}
      .dso-chevron{display:inline-block;transition:transform 180ms ease;width:16px;text-align:center;flex:none}
      .dso-chevron[data-open=true]{transform:rotate(90deg)}
      .dso-small,.dso-action,.dso-menu button{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:4px;font-family:inherit;font-weight:inherit;color:var(--dsw-alias-label-primary);background:transparent;border:.5px solid transparent;border-radius:var(--dsw-radius-sm,8px);box-shadow:inset 0 0 0 var(--dsh-hairline-width,.5px) var(--dsh-button-outline-color,var(--dsw-alias-border-l3,var(--dsw-alias-border-l2)));cursor:pointer;transition:background 130ms ease,box-shadow 130ms ease}
      .dso-small{font-size:14px;line-height:18px;height:24px;padding:0 6px;flex:none;box-shadow:none}
      .dso-action{height:28px;padding:0 10px;font-size:12px;line-height:18px}
      .dso-action:hover:not(:disabled),.dso-small:hover:not(:disabled),.dso-menu button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent))}
      .dso-action:active:not(:disabled),.dso-menu button:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active,color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent))}
      .dso-action:disabled,.dso-small:disabled,.dso-menu button:disabled{opacity:.4;cursor:not-allowed}
      .dso-action:focus-visible,.dso-small:focus-visible,.dso-menu button:focus-visible,.dso-name:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
      .dso-action-wrap{position:relative;color:var(--dsw-alias-label-primary)}
      .dso-menu{position:absolute;inset-inline-end:0;top:calc(100% + 4px);box-sizing:border-box;width:280px;max-width:min(360px,70vw);padding:12px;z-index:20;border:0;border-radius:10px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12px;line-height:1.6;box-shadow:inset 0 0 0 .5px var(--dsw-alias-border-l1),0 8px 28px color-mix(in srgb,var(--dsw-alias-bg-base) 45%,transparent)}
      .dso-menu button{height:28px;padding:0 10px;font-size:12px;line-height:18px;margin:8px 6px 0 0}
      .dso-menu p{margin:0 0 7px;color:var(--dsw-alias-label-secondary)}
      .dso-status{color:var(--dsw-alias-label-secondary);font-size:11px}
      .dso-error,.dso-menu .dso-error{color:var(--dsw-alias-state-error-primary)}
      .dso-name{width:100%;min-width:0;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-brand-primary);border-radius:5px;font:inherit;padding:2px 4px;box-sizing:border-box}
      .dso-group .dso-group-head>.dso-small{opacity:1;position:static;flex:0 0 28px;width:28px;height:28px;padding:0;border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-secondary);transition:background 130ms ease,color 130ms ease,box-shadow 130ms ease}
      .dso-group .dso-group-head>.dso-small:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent));color:var(--dsw-alias-label-primary)}
      .dso-group .dso-group-head>.dso-small[aria-expanded=true]{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 13%,transparent);color:var(--dsw-alias-brand-primary);box-shadow:inset 0 0 0 var(--dsh-hairline-width,.5px) color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,transparent)}
      .dso-group .dso-group-head>.dso-small:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
      .dso-group-panel{position:static;display:flex;flex-direction:column;gap:12px;min-width:0;max-width:100%;box-sizing:border-box;margin:8px 0 12px;padding:12px;border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-layer-1);box-shadow:inset 0 0 0 var(--dsh-hairline-width,.5px) var(--dsw-alias-border-l2)}
      .dso-group-panel.dso-floating{position:absolute;z-index:40;margin:0;width:280px;max-width:calc(100% - 24px);max-height:calc(100% - 24px);overflow:auto;overscroll-behavior:contain;box-shadow:inset 0 0 0 var(--dsh-hairline-width,.5px) var(--dsw-alias-border-l2),0 10px 32px color-mix(in srgb,var(--dsw-alias-bg-base) 45%,transparent)}
      .dso-group-panel-header{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;min-height:24px}
      .dso-group-panel label{font-size:12px;font-weight:500;line-height:18px;color:var(--dsw-alias-label-primary);min-width:0;overflow-wrap:anywhere}
      .dso-group-panel .dso-panel-close{width:24px;height:24px;padding:0;flex:none;color:var(--dsw-alias-label-secondary);font-size:16px}
      .dso-group-panel .dso-name{height:32px;min-height:32px;max-height:32px;border-color:var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,8px);font-size:12px;font-family:inherit;line-height:18px;padding:0 8px;box-shadow:none}
      .dso-group-panel .dso-name:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
      .dso-group-panel .dso-name[readonly]{opacity:.6}
      .dso-group-panel p{margin:0;font-size:12px;overflow-wrap:anywhere}
      .dso-group-actions{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;min-width:0}
      .dso-group-panel .dso-action{max-width:100%;min-width:0;white-space:normal;height:auto;min-height:30px;padding:5px 8px}
      .dso-group-panel .dso-save{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base));box-shadow:none}
      .dso-group-panel .dso-save:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary))}
      .dso-group-danger{border-block-start:var(--dsh-hairline-width,.5px) solid var(--dsw-alias-border-l1);padding-block-start:10px;display:flex;min-width:0}
      .dso-group-panel .dso-dissolve{color:var(--dsw-alias-state-error-primary);box-shadow:none;text-align:start;justify-content:flex-start;min-height:28px;margin-inline:-4px;padding:4px 6px}
      .dso-group-panel .dso-dissolve:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 9%,transparent)}
      .dso-sr{position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden}
      @media(prefers-reduced-motion:reduce){.dso-label *,.dso-chevron,.dso-gap,.dso-gap-line,.dso-action,.dso-small,.dso-menu button{animation:none!important;transition:none!important}}
    `;
    // Version-specific rc.1 entry decorator. Never re-declare native children or patch a service.
    // Retain the original registration so the renderer supplies its authorized props.
    function mapChildren(node, replace) {
      if (Array.isArray(node)) return React.Children.map(node, child => mapChildren(child, replace));
      if (!React.isValidElement(node)) return node;
      const result = replace(node);
      if (result !== node) return result;
      if (node.props.children === undefined) return node;
      return React.cloneElement(node, {}, mapChildren(node.props.children, replace));
    }
    return {
      inject: ['slots', 'locale', 'configForms'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, dictionaries));
        const t = ctx.locale.bind(NS);
        const state = createLayoutController(ctx.configForms.get(NS));
        ctx.effect(() => () => state.dispose());
        const attachment = createAttachmentStatus();
        const useAttachment = () => React.useSyncExternalStore(attachment.subscribe, attachment.getSnapshot, attachment.getSnapshot);
        const useState = () => React.useSyncExternalStore(state.subscribe, state.getSnapshot, state.getSnapshot);
        const useLocale = () => React.useSyncExternalStore(fn => ctx.locale.subscribe(fn), () => ctx.locale.getSnapshot().revision);
        function Action() {
          useLocale();
          const current = useState();
          const adapter = useAttachment();
          const adapterLabel = { waiting: 'waitingOwner', registered: 'registered', ready: 'attached', error: 'attachError', unsupported: 'unsupported' }[adapter.phase] || 'waitingOwner';
          const [open, setOpen] = React.useState(false);
          const [confirm, setConfirm] = React.useState(false);
          const ref = React.useRef(null);
          React.useEffect(() => {
            if (!open) return;
            const outside = event => { if (!ref.current?.contains(event.target)) { setOpen(false); setConfirm(false); } };
            const escape = event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); ref.current?.querySelector('button')?.focus(); } };
            document.addEventListener('pointerdown', outside, true);
            document.addEventListener('keydown', escape, true);
            return () => { document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', escape, true); };
          }, [open]);
          return h('div', { className: 'dso-action-wrap', ref },
            h('button', { type: 'button', className: 'dso-action', 'aria-expanded': open, onClick: () => setOpen(!open) }, t('organize')),
            open && h('div', { className: 'dso-menu' },
              h('p', null, t('help')),
              h('p', { role: adapter.phase === 'error' || adapter.phase === 'unsupported' ? 'alert' : 'status', className: adapter.phase === 'error' || adapter.phase === 'unsupported' ? 'dso-error' : undefined }, t(adapterLabel)),
              adapter.reason && h('p', { className: 'dso-error', style: { overflowWrap: 'anywhere' } }, adapter.reason),
              h('div', { role: current.error ? 'alert' : 'status', className: 'dso-status' + (current.error ? ' dso-error' : '') },
                t(current.error ? 'failed' : current.busy ? 'saving' : !current.ready ? 'loading' : !current.writable ? 'readonly' : current.notice || (current.saved ? 'saved' : 'ready'))),
              current.error && h('p', { className: 'dso-error', style: { overflowWrap: 'anywhere' } }, current.error),
              h('button', { type: 'button', disabled: !current.ready || !current.writable || current.busy, onClick: () => {
                if (!confirm) return setConfirm(true);
                state.commit(() => emptyLayout()); setConfirm(false);
              } }, t(confirm ? 'confirmReset' : 'reset')),
              h('button', { type: 'button', onClick: () => { setOpen(false); setConfirm(false); } }, t('close'))));
        }
        function Label({ label, hint, zone }) {
          return h('span', { className: 'dso-label', 'data-hint': Boolean(hint), 'data-direction': zone },
            h('span', { className: 'dso-original' }, label),
            h('span', { className: 'dso-hint', 'aria-hidden': true }, [...(hint || '')].map((char, index) => h('span', { key: index, style: { '--i': index } }, char))));
        }
        function Navigation({ rows, nativeButtons, listProps, active, onSelect }) {
          const localeRevision = useLocale();
          const current = useState();
          const [source, setSource] = React.useState(null);
          const [over, setOver] = React.useState(null);
          const [editing, setEditing] = React.useState(null);
          const [menu, setMenu] = React.useState(null);
          const [draft, setDraft] = React.useState('');
          const [nameError, setNameError] = React.useState(null);
          const editorTrigger = React.useRef(null);
          const popoverRef = React.useRef(null);
          const focusedPopover = React.useRef(null);
          const [floating, setFloating] = React.useState(null);
          const [localOpen, setLocalOpen] = React.useState({});
          const sourceRef = React.useRef(null);
          const hoverRef = React.useRef(null);
          const updateOver = next => {
            const value = typeof next === 'function' ? next(hoverRef.current) : next;
            hoverRef.current = value;
            setOver(value);
          };
          const consumedClick = React.useRef(0);
          const listRef = React.useRef(null);
          const liveIds = rows.map(row => row.id);
          const latestRows = React.useRef(rows);
          latestRows.current = rows;
          const visible = projectLayout(current.layout, liveIds).roots;
          const canEdit = current.ready && current.writable && !current.busy;
          const native = new Map(nativeButtons.map(button => [String(button.key), button]));
          const roster = new Map(rows.map(row => [row.id, row]));
          const finish = (accepted = false) => {
            if (sourceRef.current && !accepted) state.cancelGesture();
            sourceRef.current = null; setSource(null); updateOver(null);
            consumedClick.current = Date.now() + 200;
          };
          const currentVisibleKeys = () => {
            const roots = projectLayout(state.getSnapshot().layout, latestRows.current.map(row => row.id)).roots;
            return new Set(roots.flatMap(row => row.type === 'group' ? [row, ...row.children] : [row]).map(row => row.type + ':' + row.id));
          };
          function closeGroupEditor(restoreFocus = true) {
            setMenu(null); setEditing(null); setDraft(''); setNameError(null); setFloating(null); focusedPopover.current = null;
            if (restoreFocus) editorTrigger.current?.focus?.();
          }
          function openGroupEditor(item, trigger) {
            editorTrigger.current = trigger || null;
            setFloating(null); setMenu('group:' + item.id); setEditing(item.id); setDraft(item.name); setNameError(null);
          }
          async function saveGroupName(id) {
            if (!canEdit) return;
            if (!draft.trim()) { setNameError('emptyName'); return; }
            const accepted = await state.commit(layout => renameGroup(layout, id, draft.trim(), liveIds));
            if (accepted) closeGroupEditor();
          }
          function floatingPanel(key, content) {
            // Stay inside the EXISTING dialog/focus trap, but outside the nav's
            // scrolling/clipping subtree. Never create a second application root.
            const host = listRef.current?.closest?.('[role="dialog"]');
            if (!host) return null;
            const { placement, ...position } = floating || {};
            return ReactDOM.createPortal(React.cloneElement(content, {
              ref: popoverRef, className: content.props.className + ' dso-floating',
              style: floating ? position : { visibility: 'hidden' },
              'data-placement': placement,
            }), host, 'dso-popover:' + key);
          }
          React.useLayoutEffect(() => {
            if (!menu) { setFloating(null); return; }
            const host = listRef.current?.closest?.('[role="dialog"]');
            const anchor = editorTrigger.current || listRef.current;
            const panel = popoverRef.current;
            if (!host || !anchor || !panel) return;
            const update = () => {
              if (anchor.isConnected === false) return closeGroupEditor(false);
              const anchorRect = anchor.getBoundingClientRect();
              const viewport = anchor.closest?.('nav')?.getBoundingClientRect();
              if (viewport && (anchorRect.bottom <= viewport.top || anchorRect.top >= viewport.bottom || anchorRect.right <= viewport.left || anchorRect.left >= viewport.right)) return closeGroupEditor(false);
              const bounds = host.getBoundingClientRect();
              const scaleX = host.offsetWidth > 0 ? bounds.width / host.offsetWidth : 1;
              const scaleY = host.offsetHeight > 0 ? bounds.height / host.offsetHeight : 1;
              let direction = 'ltr';
              try { if (typeof getComputedStyle === 'function') direction = getComputedStyle(host).direction || 'ltr'; } catch {}
              const next = placePopover(anchorRect, bounds, panel.getBoundingClientRect().height / scaleY, { scaleX, scaleY, direction });
              if (!next) return closeGroupEditor(false);
              setFloating(previous => previous && Object.keys(next).every(key => previous[key] === next[key]) ? previous : next);
            };
            update();
            document.addEventListener('scroll', update, true);
            window.addEventListener?.('resize', update);
            const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
            observer?.observe(host); observer?.observe(panel);
            return () => {
              document.removeEventListener('scroll', update, true);
              window.removeEventListener?.('resize', update); observer?.disconnect();
            };
          }, [menu, rows, localeRevision, nameError, current.error]);
          React.useLayoutEffect(() => {
            if (!menu || !floating || focusedPopover.current === menu) return;
            focusedPopover.current = menu;
            popoverRef.current?.querySelector?.('input,button')?.focus?.({ preventScroll: true });
          }, [menu, floating]);
          React.useEffect(() => {
            if (editing && !visible.some(item => item.type === 'group' && item.id === editing)) closeGroupEditor(false);
          }, [editing, current.layout, rows]);
          React.useEffect(() => {
            const cancel = event => {
              if (event.key === 'Escape' && sourceRef.current) { event.stopPropagation(); event.preventDefault(); finish(); }
              else if (event.key === 'Escape' && (menu || editing)) { event.stopPropagation(); event.preventDefault(); closeGroupEditor(); }
            };
            document.addEventListener('keydown', cancel, true);
            return () => document.removeEventListener('keydown', cancel, true);
          }, [source, menu]);
          React.useEffect(() => {
            if (!canEdit) { sourceRef.current = null; setSource(null); updateOver(null); return; }
            const keys = currentVisibleKeys();
            if (source && !keys.has(source.key)) finish();
            if (over && !keys.has(over.key)) updateOver(null);
          }, [canEdit, current.layout, liveIds.join('\\0'), source, over]);
          React.useEffect(() => {
            if (!menu) return;
            const outside = event => {
              if (!popoverRef.current?.contains?.(event.target) && !editorTrigger.current?.contains?.(event.target)) closeGroupEditor(false);
            };
            document.addEventListener('pointerdown', outside, true);
            return () => document.removeEventListener('pointerdown', outside, true);
          }, [menu]);
          function targetZone(event, key, parent, forcedZone) {
            const dragging = sourceRef.current;
            const zone = forcedZone || pointerDropZone(event, parent ? 'y' : dragging?.axis,
              hoverRef.current?.key === key ? hoverRef.current.zone : null);
            const keys = currentVisibleKeys();
            if (!canEdit || !allowedDrop(dragging, key, parent, zone)
              || !keys.has(dragging.key) || !keys.has(key)) return null;
            return zone;
          }
          function activateDragVisuals() {
            const dragging = sourceRef.current;
            if (!dragging || dragging.visualStarted) return;
            // The browser must establish its native drag source before we
            // change opacity, layout, or the trailing gap's identity.
            dragging.visualStarted = true;
            state.beginGesture();
            setSource({ ...dragging }); setMenu(null);
          }
          function previewTarget(event, key, parent, forcedZone) {
            const zone = targetZone(event, key, parent, forcedZone);
            if (!zone) { updateOver(null); return; }
            event.preventDefault(); event.stopPropagation();
            activateDragVisuals();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
            updateOver(previous => previous?.key === key && previous.zone === zone ? previous : { key, zone });
            const list = listRef.current;
            if (list) {
              const rect = list.getBoundingClientRect();
              if (sourceRef.current.axis === 'x') {
                if (event.clientX < rect.left + 32) list.scrollLeft -= 12;
                else if (event.clientX > rect.right - 32) list.scrollLeft += 12;
              } else {
                if (event.clientY < rect.top + 32) list.scrollTop -= 12;
                else if (event.clientY > rect.bottom - 32) list.scrollTop += 12;
              }
            }
          }
          function commitTarget(event, key, parent, forcedZone) {
            event.preventDefault(); event.stopPropagation();
            const zone = targetZone(event, key, parent, forcedZone);
            const dragging = sourceRef.current;
            if (!zone) return finish();
            if (zone === 'center') {
              const group = parent || (key.startsWith('group:') ? key.slice(6) : null);
              if (group) setLocalOpen(previous => ({ ...previous, [group]: true }));
            }
            state.commit(layout => applyDrop(layout, latestRows.current.map(row => row.id), dragging.key, key, zone, { groupName: t('newGroup') }));
            finish(true);
          }
          function gapNode(item, parent, zone = 'before') {
            if (!item) return null;
            const key = item.type + ':' + item.id;
            const siblings = parent ? visible.find(group => group.id === parent)?.children || [] : visible;
            const previous = siblings[siblings.findIndex(node => node.id === item.id && node.type === item.type) - 1];
            const followsPreview = zone === 'before' && previous && over?.key === previous.type + ':' + previous.id && over.zone === 'after';
            return h('div', { key: 'gap:' + key + ':' + zone, className: 'dso-gap',
              'data-drop-target': key, 'data-drop-zone': zone,
              'data-hover': over?.key === key && over.zone === zone || followsPreview || undefined,
              'aria-hidden': true, onDragOver: event => previewTarget(event, key, parent, zone),
              onDrop: event => commitTarget(event, key, parent, zone) },
              h('span', { className: 'dso-gap-line' }));
          }
          function dragProps(key, item, parent) {
            return {
              draggable: canEdit && editing === null,
              onDragStart: event => {
                if (!canEdit) { event.preventDefault(); return; }
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', key);
                const dragging = { key, type: item.type, parent,
                  axis: navigationAxis(listRef.current, typeof getComputedStyle === 'function' ? getComputedStyle : undefined) };
                // No React/store publication in dragstart: keep native source
                // geometry and identity unchanged during Chromium capture.
                sourceRef.current = dragging; hoverRef.current = null;
              },
              onDragEnd: () => finish(),
              onDragOver: event => previewTarget(event, key, parent),
              onDrop: event => commitTarget(event, key, parent),
              onKeyDown: event => {
                if (!canEdit || !event.altKey) return;
                if (event.key === 'ArrowLeft' && parent && item.type === 'item') {
                  event.preventDefault(); event.stopPropagation();
                  state.commit(layout => applyDrop(layout, latestRows.current.map(row => row.id), key, 'group:' + parent, 'after'));
                  return;
                }
                if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
                event.preventDefault(); event.stopPropagation();
                const siblings = parent ? visible.find(group => group.id === parent)?.children || [] : visible;
                const index = siblings.findIndex(row => row.id === item.id && row.type === item.type);
                const target = siblings[index + (event.key === 'ArrowUp' ? -1 : 1)];
                if (target) state.commit(layout => applyDrop(layout, latestRows.current.map(row => row.id), key, target.type + ':' + target.id, event.key === 'ArrowUp' ? 'before' : 'after'));
              },
            };
          }
          function rowNode(item, parent) {
            const isGroup = item.type === 'group';
            const open = isGroup && isGroupOpen(item, localOpen);
            const key = item.type + ':' + item.id;
            const zone = over?.key === key ? over.zone : null;
            const label = isGroup ? item.name : roster.get(item.id)?.label || item.id;
            const hint = zone ? (zone === 'center' ? t(isGroup || parent ? 'join' : 'create') : (source?.axis === 'x' && !parent ? zone === 'before' ? '← ' : '→ ' : zone === 'before' ? '↑ ' : '↓ ') + t(zone)) : '';
            let button;
            if (!isGroup) {
              const base = native.get(item.id);
              if (!base) return null;
              const children = React.Children.toArray(base.props.children);
              const labelNode = children[children.length - 1];
              children[children.length - 1] = React.isValidElement(labelNode)
                ? React.cloneElement(labelNode, {}, h(Label, { label, hint, zone })) : h(Label, { label, hint, zone });
              button = React.cloneElement(base, {
                ...dragProps(key, item, parent),
                onClick: event => { if (Date.now() < consumedClick.current) return event.preventDefault(); base.props.onClick?.(event); },
                'data-organizer-id': item.id,
                onContextMenu: event => {
                  if (!parent || !canEdit) return;
                  event.preventDefault(); const openMenu = menu !== key; closeGroupEditor(false);
                  if (openMenu) { editorTrigger.current = event.currentTarget; setMenu(key); }
                },
              }, children);
            } else {
              const base = nativeButtons.find(button => button.props['aria-current'] !== 'true') || nativeButtons[0];
              const baseChildren = React.Children.toArray(base?.props.children);
              button = h('button', {
                type: 'button', className: base?.props.className,
                style: { background: item.children.some(child => child.id === active) ? 'color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,transparent)' : undefined },
                ...dragProps(key, item, null),
                'aria-expanded': open, 'aria-controls': 'dso-group-' + item.id,
                'data-organizer-group': item.id,
                'data-modal-autofocus': !open && item.children.some(child => child.id === active) ? '' : undefined,
                onClick: () => {
                  if (Date.now() < consumedClick.current) return;
                  setLocalOpen(previous => ({ ...previous, [item.id]: !open }));
                  if (canEdit) state.commit(layout => toggleGroup(layout, item.id, liveIds, !open));
                },
                onDoubleClick: event => { if (canEdit) openGroupEditor(item, event?.currentTarget); },
                onContextMenu: event => { event.preventDefault(); if (menu === key) closeGroupEditor(); else openGroupEditor(item, event.currentTarget); },
              },
              h('span', { className: (baseChildren[0]?.props?.className || '') + ' dso-chevron', 'data-open': open, 'aria-hidden': true }, '›'),
              h(Label, { label, hint, zone }),
              h('span', { className: 'dso-count', 'aria-hidden': true }, item.children.length));
            }
            const menuNode = !isGroup && menu === key && h('div', { className: 'dso-group-panel dso-item-panel', role: 'group', 'aria-label': t('menu') + ': ' + label,
              onKeyDown: event => { if (event.key === 'Escape') { event.stopPropagation(); closeGroupEditor(); } } },
              h('button', { type: 'button', className: 'dso-action', disabled: !canEdit, onClick: () => { state.commit(layout => applyDrop(layout, liveIds, key, 'group:' + parent, 'after')); closeGroupEditor(false); } }, t('root')),
              h('button', { type: 'button', className: 'dso-action', onClick: () => closeGroupEditor() }, t('close')));
            const row = h('div', { className: 'dso-row', 'data-dso-root': !parent && !isGroup ? 'true' : undefined, 'data-zone': zone || undefined, 'data-source': source?.key === key || undefined }, button, !isGroup && menuNode && floatingPanel(key, menuNode));
            if (!isGroup) return h(React.Fragment, { key }, gapNode(item, parent), row);
            return h(React.Fragment, { key }, gapNode(item, parent), h('div', { className: 'dso-group', 'data-dso-root': 'true' },
              h('div', { className: 'dso-group-head' },
                h('div', { style: { flex: 1, minWidth: 0 } }, row),
                h('button', { type: 'button', className: 'dso-small', 'aria-label': t('menu') + ': ' + item.name,
                  'data-group-settings': item.id, 'aria-expanded': menu === key, 'aria-controls': 'dso-group-panel-' + item.id,
                  onClick: event => { if (menu === key) closeGroupEditor(); else openGroupEditor(item, event?.currentTarget); } }, '⋯')),
              menu === key && floatingPanel(key, h('div', { id: 'dso-group-panel-' + item.id, className: 'dso-group-panel', role: 'group', 'aria-label': t('menu') + ': ' + item.name },
                h('div', { className: 'dso-group-panel-header' },
                  h('label', { htmlFor: 'dso-group-name-' + item.id }, t('groupName')),
                  h('button', { type: 'button', className: 'dso-small dso-panel-close', 'aria-label': t('close'), title: t('close'), onClick: () => closeGroupEditor() }, '×')),
                h('input', { id: 'dso-group-name-' + item.id, className: 'dso-name', value: draft, maxLength: 120,
                  readOnly: !canEdit, draggable: false, 'aria-label': t('groupName'), 'aria-invalid': Boolean(nameError),
                  onChange: event => { setDraft(event.target.value); setNameError(null); },
                  onKeyDown: event => {
                    event.stopPropagation();
                    if (event.key === 'Enter' && !event.nativeEvent?.isComposing && !event.isComposing) { event.preventDefault(); saveGroupName(item.id); }
                    if (event.key === 'Escape') { event.preventDefault(); closeGroupEditor(); }
                  } }),
                nameError && h('p', { className: 'dso-error', role: 'alert' }, t(nameError)),
                current.error && h('p', { className: 'dso-error', role: 'alert' }, t('failed')),
                h('div', { className: 'dso-group-actions' },
                  h('button', { type: 'button', className: 'dso-action dso-save', 'data-group-action': 'save', disabled: !canEdit || !draft.trim(), onClick: () => saveGroupName(item.id) }, t('saveName')),
                  h('button', { type: 'button', className: 'dso-action', 'data-group-action': 'cancel', onClick: () => closeGroupEditor() }, t('cancel'))),
                h('div', { className: 'dso-group-danger' },
                  h('button', { type: 'button', className: 'dso-action dso-dissolve', 'data-group-action': 'dissolve', disabled: !canEdit,
                    onClick: async () => { if (await state.commit(layout => dissolveGroup(layout, item.id, liveIds))) closeGroupEditor(); } }, t('dissolve'))))),
              h('div', { id: 'dso-group-' + item.id, className: 'dso-children', 'data-dragging': Boolean(source), 'data-axis': 'y', hidden: !open, style: !open ? { display: 'none' } : undefined }, open && item.children.map(child => rowNode(child, item.id)), open && gapNode(item.children.at(-1), item.id, 'after'))));
          }
          return h('div', { ...listProps, ref: listRef, className: (listProps.className || '') + ' dso-list',
            'data-axis': source?.axis, 'data-dragging': Boolean(source),
            onDragLeave: event => {
              // Chromium can emit null when crossing descendants during native DnD.
              // A preview is harmless; drop independently recomputes its final intent.
              if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) updateOver(null);
            } },
            visible.map(item => rowNode(item, null)),
            gapNode(visible.filter(row => row.type + ':' + row.id !== source?.key).at(-1), null, 'after'),
            current.error && h('div', { role: 'alert', className: 'dso-error' }, t('failed')),
            h('span', { role: 'status', 'aria-live': 'polite', className: 'dso-sr' }, over ? t(over.zone === 'center' ? 'create' : over.zone) : ''));
        }
        // Replace only the native nav element in its EXISTING portal. Native modal focus handling,
        // Escape, title, account launcher, updates, and every settings.section remain untouched.
        function makeRoot(original, isActive) {
          const panels = new WeakMap();
          function getPanel(OriginalPanel) {
            if (panels.has(OriginalPanel)) return panels.get(OriginalPanel);
            function AdaptedPanel(props) {
              const portal = OriginalPanel(props);
              let matched = false;
              const hasPortal = Boolean(portal?.containerInfo && portal.children);
              const children = hasPortal ? mapChildren(portal.children, node => {
                if (node.type !== 'nav') return node;
                const list = node.props.children;
                if (!React.isValidElement(list)) return node;
                const nativeButtons = matchNavigationButtons(React, list.props.children, props.rows);
                if (!nativeButtons) return node;

                matched = true;
                return React.cloneElement(node, {}, h(Navigation, { rows: props.rows, nativeButtons, listProps: list.props, active: props.activeId ?? props.rows[0]?.id, onSelect: props.onSelect }));
              }) : undefined;
              const reason = matched ? '' : hasPortal
                ? 'Could not identify navigation list in native settings panel'
                : 'Native settings panel did not return a supported portal';
              React.useLayoutEffect(() => {
                attachment.report({ phase: matched ? 'ready' : 'unsupported', reason });
              }, [matched, reason]);
              return matched ? ReactDOM.createPortal(children, portal.containerInfo, portal.key) : portal;
            }
            panels.set(OriginalPanel, AdaptedPanel);
            return AdaptedPanel;
          }
          function AdaptedRoot(props) {
            const tree = original.component(props);
            const shell = props.useStore(value => value);
            let panelsFound = 0;
            const result = mapChildren(tree, node => {
              if (typeof node.type !== 'function' || !Array.isArray(node.props.rows) || typeof node.props.onSelect !== 'function' || typeof node.props.onClose !== 'function' || typeof node.props.renderSlot !== 'function') return node;
              panelsFound += 1;
              return h(getPanel(node.type), { ...node.props, key: node.key });
            });
            React.useLayoutEffect(() => {
              if (shell.open && !panelsFound) attachment.report({ phase: 'unsupported', reason: 'No supported settings panel was found in the native settings root' });
            }, [shell.open, panelsFound]);
            return result;
          }
          // Errors in our descendants must never abdicate the native settings entry.
          class AdapterBoundary extends React.Component {
            constructor(props) { super(props); this.state = { failed: false }; }
            static getDerivedStateFromError() { return { failed: true }; }
            componentDidCatch(error) { attachment.report({ phase: 'error', reason: String(error?.message ?? error) }); }
            render() { return this.state.failed ? h(original.component, this.props.nativeProps) : this.props.children; }
          }
          return function OrganizerRoot(props) {
            if (!isActive()) return h(original.component, props);
            return h(AdapterBoundary, { nativeProps: props }, h(AdaptedRoot, props));
          };
        }
        ctx.effect(() => observeSettingsOwner(ctx.slots,
          (owner, mark) => decorateSettingsEntry(ctx.slots, owner, makeRoot, mark),
          next => attachment.report(next)));

        ctx.slots.inject('settings.action', () => ctx.slots.register({ name: 'settings.action', id: NS, order: 90 }, Action));
        ctx.slots.inject('settings.action', () => ctx.slots.register({ name: 'settings.action', id: NS + '-styles', order: 91 }, () => h('style', null, css)));
      },
    };
  },
});
