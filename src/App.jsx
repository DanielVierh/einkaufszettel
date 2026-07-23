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
import WeeklyPlanModal from "./components/WeeklyPlanModal";
import { useState } from "react";

function App() {
  const { user } = useUser();
  const [showItemList, setShowItemList] = useState(false);
  const [showWeeklyPlan, setShowWeeklyPlan] = useState(false);

  function toggleItemList() {
    setShowItemList((s) => !s);
  }

  function toggleWeeklyPlan() {
    setShowWeeklyPlan((s) => !s);
  }
  console.log(user);

  return (
    <>
      <SignedOut>
        <h1>Einkaufszettel</h1>
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
            <ShoppingList
              onToggleItemList={toggleItemList}
              onOpenWeeklyPlan={toggleWeeklyPlan}
              userId={user.id}
              user_name={user.firstName}
            />
            <ItemList
              visible={showItemList}
              onClose={toggleItemList}
              userId={user.id}
              user_name={user.firstName}
            />
            <NewItemForm userId={user.id} user_name={user.firstName} />
            <WeeklyPlanModal
              visible={showWeeklyPlan}
              onClose={toggleWeeklyPlan}
              userId={user.id}
              userName={user.firstName}
            />
          </>
        ) : (
          <p>Loading User...</p>
        )}
      </SignedIn>
    </>
  );
}

export default App;
