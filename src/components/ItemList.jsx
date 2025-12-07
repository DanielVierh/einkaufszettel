import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const ItemList = ({ userId, user_name }) => {
  const [itemname, setItemname] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const supabase_URL = import.meta.env.VITE_SUPABASE_URL;
  const supabase_API_KEY = import.meta.env.VITE_SUPABASE_API_KEY;
  const supabase = createClient(supabase_URL, supabase_API_KEY);

  async function handleAddItem(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (itemname === "") {
      setError("Ein Name muss eingetragen werden");
      return;
    }

    try {
      await supabase.from("shopping_items").insert({
        user_id: userId,
        item_name: itemname,
        item_price: "0.0",
        item_on_list: false,
        item_is_open: false,
        item_amount: 1,
        item_on_weekly_list: false,
        item_comment: "",
        item_creator: user_name,
      });
      setSuccess("Neues Item gespeichert");
      setItemname("");
    } catch (err) {
      setError(err);
      console.log(error);
      return null;
    }
  }

  return (
    <div>
      <h2>ItemList</h2>
      <form onSubmit={handleAddItem}>
        <input
          type="text"
          value={itemname}
          onChange={(e) => setItemname(e.target.value)}
          placeholder="Item Bezeichnung"
        />
        <button>Hinzufügen</button>

        {error ? (
          <p style={{ color: "red" }}>
            Da ist etwas schief gelaufen <br></br> {error}
          </p>
        ) : (
          <p style={{ color: "green" }}>{success}</p>
        )}
      </form>
    </div>
  );
};

export default ItemList;
