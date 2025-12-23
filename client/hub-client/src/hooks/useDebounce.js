import { useState, useEffect } from 'react';

const useDebounce = (value, delay = 500) => {
    const [debounced, set] = useState(value);

    useEffect(() => {
        const t = setTimeout(() => set(value), delay);

        return () => clearTimeout(t);
    }, [value, delay]);

    return debounced;
};

export default useDebounce;