import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Item {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
}

// SIMULATION: This replaces Supabase calls
const STORAGE_KEY = "sim_database_items";

const INITIAL_DATA: Item[] = [
  { id: "sim-1", title: "Configurar Projeto", description: "Configurar ambiente de desenvolvimento", completed: true, createdAt: new Date().toISOString() },
  { id: "sim-2", title: "Implementar Mocks", description: "Criar hooks de simulação", completed: true, createdAt: new Date().toISOString() },
  { id: "sim-3", title: "Desenvolver UI", description: "Criar interface do dashboard", completed: false, createdAt: new Date().toISOString() },
];

const getItems = (): Item[] => {
  if (typeof window === 'undefined') return INITIAL_DATA;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    saveItems(INITIAL_DATA);
    return INITIAL_DATA;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_DATA;
  }
};

const saveItems = (items: Item[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export function useItems() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      return getItems();
    },
  });

  const addItem = useMutation({
    mutationFn: async (newItem: Omit<Item, "id" | "createdAt" | "completed">) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const items = getItems();
      const item: Item = {
        ...newItem,
        id: "sim-" + Math.random().toString(36).substr(2, 9),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      saveItems([item, ...items]);
      return item;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  const updateItem = useMutation({
    mutationFn: async (updatedItem: Partial<Item> & { id: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const items = getItems();
      const newItems = items.map((i) => (i.id === updatedItem.id ? { ...i, ...updatedItem } : i));
      saveItems(newItems);
      return updatedItem;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const items = getItems();
      const newItems = items.filter((i) => i.id !== id);
      saveItems(newItems);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    addItem: addItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    deleteItem: deleteItem.mutateAsync,
  };
}
