import { useAuth } from "../auth.jsx";
import { useSaved } from "../saved.jsx";

export default function Account() {
  const { user, logout } = useAuth();
  const { saved } = useSaved();

  return (
    <>
      <div className="page-head">
        <h1>Account</h1>
      </div>
      <section className="card panel account">
        <dl>
          <dt>Name</dt>
          <dd>{user.name}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Member since</dt>
          <dd>{new Date(user.created_at).toLocaleDateString()}</dd>
          <dt>Saved articles</dt>
          <dd>{saved.length}</dd>
        </dl>
        <button className="btn btn-outline" onClick={logout}>Log out</button>
      </section>
    </>
  );
}
