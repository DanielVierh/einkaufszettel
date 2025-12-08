import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_API_KEY
);

const ItemList = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supabase.from("shopping_items").select();
        if (error) {
          console.error("Supabase error:", error);
          return;
        }
        if (mounted) setItems(data ?? []);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id ?? item.item_name}>{item.item_name}</li>
      ))}
    </ul>
  );
};

export default ItemList;
