// Knopf „Link teilen“ für ein Fahrzeug oder einen Roadtrip (siehe lib/share.ts)
import { Link2 } from 'lucide-react'
import { useState } from 'react'
import { useT } from '../i18n/i18n.ts'
import { offerLink, shareUrl } from '../lib/share.ts'

export function ShareLink({ title, make, label, hint }: { title: string; make: () => Promise<{ code: string; note?: string }>; label?: string; hint?: string }) {
  const { tx } = useT()
  const [state, setState] = useState<{ msg: string; url?: string } | null>(null)
  const run = async () => {
    const { code, note } = await make()
    const url = shareUrl(code)
    const how = await offerLink(url, title)
    const msg = how === 'copied' ? tx('Link kopiert.', 'Link copied.') : how === 'shared' ? tx('Geteilt.', 'Shared.') : tx('Kopier den Link:', 'Copy the link:')
    setState({ msg: [msg, note].filter(Boolean).join(' '), url: how === 'shown' ? url : undefined })
  }
  return (
    <div className="share-link">
      <button className="btn" onClick={run}>
        <Link2 size={15} /> {label ?? tx('Link teilen', 'Share link')}
      </button>
      {state ? (
        <p className="muted small" role="status">
          {state.msg}
          {state.url && <input className="input" readOnly value={state.url} onFocus={(e) => e.currentTarget.select()} />}
        </p>
      ) : (
        hint && <p className="muted small">{hint}</p>
      )}
    </div>
  )
}
