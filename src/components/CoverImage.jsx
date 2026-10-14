import { useEffect, useState } from 'react';
import { fetchCoverUrl } from '../api/client';

export default function CoverImage({ bookId, title }) {
  const [src, setSrc] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;
    setState('loading');
    setSrc(null);

    fetchCoverUrl(bookId)
      .then((url) => {
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        if (url) {
          objectUrl = url;
          setSrc(url);
          setState('ready');
        } else {
          setState('empty');
        }
      })
      .catch(() => {
        if (!cancelled) setState('empty');
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [bookId]);

  if (state === 'ready' && src) {
    return <img className="cover" src={src} alt={`Portada de ${title || 'libro'}`} />;
  }

  return (
    <div className="cover cover--placeholder" title="Sin portada">
      <span>{state === 'loading' ? '' : 'Sin portada'}</span>
    </div>
  );
}
