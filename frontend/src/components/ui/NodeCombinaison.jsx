import { useCallback } from 'react';

export function NodeCombinaison(props) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);
 
  return (
    <div className="text-updater-node">
      <div>
        <label>Combinaison</label>
      </div>
    </div>
  );
}