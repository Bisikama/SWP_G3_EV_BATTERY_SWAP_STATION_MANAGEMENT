//API hooks

import { useState, useEffect } from 'react';

export const useApi = (apiFunction, dependencies = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await apiFunction();
                setData(response.data);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, dependencies);

    const refetch = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiFunction();
            setData(response.data);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, refetch };
};

// Hook for CRUD operations
export const useCrud = (apiService) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAll();
            setItems(response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const createItem = async (data) => {
        try {
            const response = await apiService.create(data);
            setItems(prev => [...prev, response.data]);
            return response.data;
        } catch (err) {
            throw err;
        }
    };

    const updateItem = async (id, data) => {
        try {
            const response = await apiService.update(id, data);
            setItems(prev => prev.map(item =>
                item.id === id ? response.data : item
            ));
            return response.data;
        } catch (err) {
            throw err;
        }
    };

    const deleteItem = async (id) => {
        try {
            await apiService.delete(id);
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            throw err;
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    return {
        items,
        loading,
        error,
        createItem,
        updateItem,
        deleteItem,
        refetch: fetchItems,
    };
};