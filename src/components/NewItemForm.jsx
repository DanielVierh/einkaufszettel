import { useState } from "react";
import supabase from "../lib/supabaseClient";

const NewItemForm = ({ userId, user_name }) => {
  const [itemname, setItemname] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        item_on_list: true,
        item_is_open: true,
        item_amount: 1,
        item_on_weekly_list: false,
        item_comment: "",
        item_creator: user_name,
      });
      setSuccess("Neues Item gespeichert");
      setItemname("");
      // notify other components that items changed
      try {
        window.dispatchEvent(new CustomEvent("items:changed"));
      } catch (e) {
        console.log(e);

        // ignore if dispatch not supported
      }
    } catch (err) {
      setError(String(err));
      console.error(err);
      return null;
    }
  }

  return (
    <div>
      <h2>Produkt hinzufügen</h2>
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
export default NewItemForm;
