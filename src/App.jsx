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

function App() {
  const { user } = useUser();
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
              <UserButton />
            </header>
            <ItemList userId={user.id} user_name={user.firstName} />
            <NewItemForm />
          </>
        ) : (
          <p>Loading User...</p>
        )}
      </SignedIn>
    </>
  );
}

export default App;
