import "./App.css";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import ItemList from "./components/ItemList";
import NewItemForm from "./components/NewItemForm";
import ShoppingList from "./components/ShoppingList";
import { useState } from "react";

function App() {
  const { user } = useUser();
  const [showItemList, setShowItemList] = useState(false);

  function toggleItemList() {
    setShowItemList((s) => !s);
  }
  console.log(user);

  return (
    <>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        {user ? (
          <>
            <header>
              <h3>Hi {user.firstName || user.username || "User"}</h3>
              <h2>Einkaufszettel</h2>
              <UserButton />
            </header>
            <ShoppingList onToggleItemList={toggleItemList} />
            <ItemList
              visible={showItemList}
              onClose={toggleItemList}
              userId={user.id}
              user_name={user.firstName}
            />
            <NewItemForm userId={user.id} user_name={user.firstName} />
          </>
        ) : (
          <p>Loading User...</p>
        )}
      </SignedIn>
    </>
  );
}

export default App;
