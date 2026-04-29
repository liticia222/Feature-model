import { useCallback } from 'react';

export function NodeXOR(props) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);
 
  return (
    <div className="text-updater-node">
      <div>
        <label>XOR</label>
      </div>
    </div>
  );
}