import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Opens a dialog when the page is loaded with ?new=1 (used by the command
 * palette's "Add X" quick actions to deep-link straight into the form) and
 * strips the param afterward so a refresh doesn't reopen it.
 */
export function useOpenOnQueryParam(onOpen: () => void) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      onOpen();
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
