import { useCallback } from 'react';

export function NodeFeature(props) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);
 
  return (
    <div className="text-updater-node">
      <div>
        <input id="text" name="text" onChange={onChange} className="nodrag" />
      </div>
    </div>
  );
}