import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, MapPin, Package, Heart, User, Lock } from "lucide-react";
import { addressesApi, authApi, profileApi } from "../api/services";
import { useStore } from "../context/Store";
import { useQuery } from "../hooks/useQuery";
import {
  EmptyState,
  Field,
  MutationStatus,
  PageHeading,
  Pagination,
  QueryState,
  useMutation,
} from "../components/UI";
export function AuthPage({ register = false }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    password_confirm: "",
  });
  const { authenticate } = useStore(),
    navigate = useNavigate(),
    location = useLocation(),
    mutation = useMutation();
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  return (
    <div className="auth-layout wrap page">
      <div className="auth-story">
        <span className="eyebrow">YOUR EVERYDAY, A LITTLE BETTER</span>
        <h1>
          A place for
          <br />
          <em>your kind</em>
          <br />
          of things.
        </h1>
        <p>
          Save your favourites. Find something new.
          <br />
          Make yourself at home.
        </p>
        <span className="auth-monogram">f&f</span>
      </div>
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.run(
            () =>
              authenticate(
                register ? "register" : "login",
                register
                  ? form
                  : { email: form.email, password: form.password },
              ),
            () =>
              navigate(
                location.state?.from?.startsWith("/") &&
                  !location.state.from.startsWith("//")
                  ? location.state.from
                  : "/profile",
                { replace: true },
              ),
          );
        }}
      >
        <span className="eyebrow">
          {register ? "JOIN THE EVERYDAY" : "GOOD TO SEE YOU AGAIN"}
        </span>
        <h2>{register ? "Make yourself at home." : "Welcome back."}</h2>
        <p className="muted">
          {register
            ? "Create your Form & Field account."
            : "Sign in to your own little corner."}
        </p>
        {register && (
          <div className="form-grid">
            <Field
              label="First name"
              name="first_name"
              required
              value={form.first_name}
              onChange={change}
            />
            <Field
              label="Last name"
              name="last_name"
              required
              value={form.last_name}
              onChange={change}
            />
          </div>
        )}
        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={change}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          minLength={register ? 8 : undefined}
          required
          value={form.password}
          onChange={change}
        />
        {register && (
          <Field
            label="Confirm password"
            name="password_confirm"
            type="password"
            autoComplete="new-password"
            required
            value={form.password_confirm}
            onChange={change}
          />
        )}
        <MutationStatus mutation={mutation} />
        <button className="full" disabled={mutation.pending}>
          {mutation.pending
            ? "Please wait…"
            : register
              ? "Create account"
              : "Sign in"}
          <ArrowRight size={17} />
        </button>
        <p className="auth-switch">
          {register ? "Already part of the family?" : "New around here?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </form>
    </div>
  );
}
export function ProfilePage() {
  const query = useQuery(profileApi.get, []);
  return (
    <div className="wrap page">
      <PageHeading title="Your little corner." eyebrow="MY ACCOUNT" />
      <QueryState query={query}>
        {(profile) => (
          <div className="profile-banner">
            <div className="avatar">{profile.first_name?.[0] || "F"}</div>
            <div>
              <h2>Hello, {profile.first_name || "there"}.</h2>
              <p>{profile.email}</p>
              {profile.phone && <p>{profile.phone}</p>}
            </div>
            <Link className="button secondary" to="/profile/edit">
              Edit profile
            </Link>
          </div>
        )}
      </QueryState>
      <div className="account-grid">
        {[
          [
            "/orders",
            Package,
            "Your orders",
            "Follow every find, from here to your door.",
          ],
          [
            "/wishlist",
            Heart,
            "Saved for later",
            "All the things you have your eye on.",
          ],
          [
            "/profile/addresses",
            MapPin,
            "Your addresses",
            "The places you call home.",
          ],
          [
            "/profile/edit",
            User,
            "Personal details",
            "Keep your information up to date.",
          ],
          [
            "/profile/password",
            Lock,
            "Account security",
            "Make a fresh start with a new password.",
          ],
        ].map(([to, Icon, title, text]) => (
          <Link key={to} className="panel account-card" to={to}>
            <Icon />
            <h3>{title}</h3>
            <p>{text}</p>
            <ArrowRight size={18} />
          </Link>
        ))}
      </div>
    </div>
  );
}
function ProfileForm({ profile }) {
  const [form, setForm] = useState({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone || "",
      date_of_birth: profile.date_of_birth || "",
      profile_image: profile.profile_image || "",
    }),
    mutation = useMutation(),
    { setUser, user } = useStore();
  return (
    <form
      className="panel narrow"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.run(
          () =>
            profileApi.update({
              ...form,
              date_of_birth: form.date_of_birth || null,
              profile_image: form.profile_image || null,
            }),
          (data) => {
            setUser({
              ...user,
              first_name: data.first_name,
              last_name: data.last_name,
            });
            mutation.setMessage("Your details are up to date.");
          },
        );
      }}
    >
      {[
        ["first_name", "First name"],
        ["last_name", "Last name"],
        ["phone", "Phone number"],
        ["date_of_birth", "Date of birth", "date"],
        ["profile_image", "Profile image URL", "url"],
      ].map(([key, label, type]) => (
        <Field
          key={key}
          label={label}
          type={type}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      ))}
      <MutationStatus mutation={mutation} />
      <button disabled={mutation.pending}>
        {mutation.pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
export function EditProfilePage() {
  const query = useQuery(profileApi.get, []);
  return (
    <div className="wrap page">
      <PageHeading title="The personal details." />
      <QueryState query={query}>
        {(data) => <ProfileForm profile={data} />}
      </QueryState>
    </div>
  );
}
export function PasswordPage() {
  const [form, setForm] = useState({
      old_password: "",
      new_password: "",
      new_password_confirm: "",
    }),
    mutation = useMutation();
  return (
    <div className="wrap page">
      <PageHeading title="A fresh password." />
      <form
        className="panel narrow"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.run(
            () => authApi.password(form),
            () => {
              setForm({
                old_password: "",
                new_password: "",
                new_password_confirm: "",
              });
              mutation.setMessage("Password changed successfully.");
            },
          );
        }}
      >
        {[
          ["old_password", "Current password"],
          ["new_password", "New password"],
          ["new_password_confirm", "Confirm new password"],
        ].map(([key, label]) => (
          <Field
            key={key}
            label={label}
            type="password"
            autoComplete={
              key === "old_password" ? "current-password" : "new-password"
            }
            minLength={key === "old_password" ? undefined : 8}
            required
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        ))}
        <MutationStatus mutation={mutation} />
        <button disabled={mutation.pending}>Change password</button>
      </form>
    </div>
  );
}
export function AddressCard({ address, children }) {
  return (
    <article className="panel address-card">
      <span className="eyebrow">
        {address.address_type}
        {address.is_default ? " · DEFAULT" : ""}
      </span>
      <h3>{address.full_name}</h3>
      <p>
        {address.address_line_1}
        <br />
        {address.address_line_2 && (
          <>
            {address.address_line_2}
            <br />
          </>
        )}
        {address.city}, {address.state} {address.postal_code}
        <br />
        {address.country}
      </p>
      <p>{address.phone}</p>
      {children}
    </article>
  );
}
export function AddressesPage() {
  const [page, setPage] = useState(1),
    query = useQuery(() => addressesApi.list({ page }), [page]),
    mutation = useMutation();
  return (
    <div className="wrap page">
      <PageHeading title="The places you call home.">
        <Link className="button" to="/profile/addresses/new">
          Add an address
        </Link>
      </PageHeading>
      <MutationStatus mutation={mutation} />
      <QueryState query={query}>
        {(data) => (
          <>
            {data.results.length ? (
              <div className="account-grid">
                {data.results.map((a) => (
                  <AddressCard key={a.id} address={a}>
                    <div className="inline">
                      <Link to={`/profile/addresses/${a.id}/edit`}>Edit</Link>
                      <button
                        className="text-button"
                        disabled={mutation.pending}
                        onClick={() =>
                          mutation.run(
                            () => addressesApi.remove(a.id),
                            query.reload,
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </AddressCard>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Where should we send your finds?"
                text="Add your first shipping address."
              />
            )}
            <Pagination data={data} page={page} onChange={setPage} />
          </>
        )}
      </QueryState>
    </div>
  );
}
function AddressForm({ initial = {} }) {
  const [form, setForm] = useState({
      full_name: "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "IN",
      address_type: "HOME",
      is_default: false,
      ...initial,
    }),
    mutation = useMutation(),
    navigate = useNavigate();
  return (
    <form
      className="panel narrow"
      onSubmit={(e) => {
        e.preventDefault();
        const { id, ...body } = form;
        mutation.run(
          () =>
            id ? addressesApi.update(id, body) : addressesApi.create(body),
          () => navigate("/profile/addresses"),
        );
      }}
    >
      <div className="form-grid">
        {[
          ["full_name", "Full name"],
          ["phone", "Phone"],
          ["address_line_1", "Address line 1"],
          ["address_line_2", "Address line 2 (optional)"],
          ["city", "City"],
          ["state", "State"],
          ["postal_code", "Postal code"],
          ["country", "Country (ISO code)"],
        ].map(([key, label]) => (
          <Field
            key={key}
            label={label}
            required={key !== "address_line_2"}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        ))}
        <label className="field">
          Address type
          <select
            value={form.address_type}
            onChange={(e) => setForm({ ...form, address_type: e.target.value })}
          >
            <option>HOME</option>
            <option>WORK</option>
            <option>OTHER</option>
          </select>
        </label>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
        />{" "}
        Make this my default address
      </label>
      <MutationStatus mutation={mutation} />
      <button disabled={mutation.pending}>
        {mutation.pending ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}
export function AddressEditPage() {
  const { id } = useParams(),
    query = useQuery(
      () => (id ? addressesApi.get(id) : Promise.resolve({})),
      [id],
    );
  return (
    <div className="wrap page">
      <PageHeading title={id ? "Update your address." : "A new place."} />
      <QueryState query={query}>
        {(data) => <AddressForm initial={data} />}
      </QueryState>
    </div>
  );
}
