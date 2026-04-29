import { useCallback } from 'react';

export function NodeOR(props) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);
 
  return (
    <div className="text-updater-node">
      <div>
        <label>OR</label>
      </div>
    </div>
  );
}