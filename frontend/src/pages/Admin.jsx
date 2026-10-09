import { useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { resourceApi } from "../api/services";
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
import { money } from "../utils/format";
const fields = {
  categories: [
    ["name", "Name"],
    ["slug", "Slug"],
    ["description", "Description", "textarea"],
    ["image", "Image URL", "url"],
    ["parent_id", "Parent category ID", "number"],
    ["is_active", "Active", "checkbox"],
  ],
  brands: [
    ["name", "Name"],
    ["slug", "Slug"],
    ["description", "Description", "textarea"],
    ["logo", "Logo URL", "url"],
    ["is_active", "Active", "checkbox"],
  ],
  products: [
    ["name", "Name"],
    ["slug", "Slug"],
    ["description", "Description", "textarea"],
    ["short_description", "Short description"],
    ["category_id", "Category ID", "number"],
    ["brand_id", "Brand ID (optional)", "number"],
    ["price", "Price (INR)", "number"],
    ["discount_price", "Sale price (optional)", "number"],
    ["stock", "Stock", "number"],
    ["sku", "SKU"],
    ["is_active", "Active", "checkbox"],
    ["is_featured", "Featured", "checkbox"],
    ["images", "Images (JSON array)", "textarea"],
    ["variants", "Variants (JSON array)", "textarea"],
  ],
};
function Editor({ resource, current, close, reload }) {
  const initial = Object.fromEntries(
    (fields[resource] || []).map(([key, , type]) => [
      key,
      key === "images" || key === "variants"
        ? JSON.stringify(current?.[key] || [], null, 2)
        : key.endsWith("_id")
          ? (current?.[key.replace("_id", "")]?.id ?? "")
          : (current?.[key] ??
            (type === "checkbox" ? key === "is_active" : "")),
    ]),
  );
  const [form, setForm] = useState(
      resource === "orders" ? { order_status: current.order_status } : initial,
    ),
    mutation = useMutation();
  const submit = () => {
    const body = { ...form };
    if (resource === "orders")
      return resourceApi(resource).update(current.id, body);
    for (const [key, , type] of fields[resource]) {
      if (key === "images" || key === "variants") {
        try {
          body[key] = JSON.parse(body[key]);
        } catch {
          throw {
            response: { data: { [key]: ["Enter a valid JSON array."] } },
          };
        }
        if (!Array.isArray(body[key]))
          throw { response: { data: { [key]: ["Expected an array."] } } };
      } else if (type === "number")
        body[key] =
          body[key] === ""
            ? null
            : ["price", "discount_price"].includes(key)
              ? String(body[key])
              : Number(body[key]);
      else if (type === "url") body[key] ||= null;
    }
    if (resource === "products") {
      body.images = body.images.map(({ product, ...image }) => image);
    }
    return current
      ? resourceApi(resource).update(current.id, body)
      : resourceApi(resource).create(body);
  };
  return (
    <section className="panel admin-editor">
      <div className="section-heading">
        <h2>
          {current ? "Edit" : "Create"} {resource.slice(0, -1)}
        </h2>
        <button className="secondary" onClick={close}>
          Close
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.run(submit, () => {
            close();
            reload();
          });
        }}
      >
        <div className="form-grid">
          {resource === "orders" ? (
            <label className="field">
              Order status
              <select
                value={form.order_status}
                onChange={(e) => setForm({ order_status: e.target.value })}
              >
                {[
                  "PENDING",
                  "CONFIRMED",
                  "PROCESSING",
                  "SHIPPED",
                  "DELIVERED",
                  "CANCELLED",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          ) : (
            fields[resource].map(([key, label, type]) =>
              type === "checkbox" ? (
                <label className="check" key={key}>
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.checked })
                    }
                  />
                  {label}
                </label>
              ) : (
                <Field
                  key={key}
                  label={label}
                  type={type || "text"}
                  min={type === "number" ? 0 : undefined}
                  step={
                    ["price", "discount_price"].includes(key)
                      ? "0.01"
                      : undefined
                  }
                  required={[
                    "name",
                    "slug",
                    "category_id",
                    "price",
                    "sku",
                    "stock",
                  ].includes(key)}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              ),
            )
          )}
        </div>
        {resource === "products" && (
          <p className="muted">
            Image objects: image (URL), alt_text, is_primary, display_order.
            Variant objects: name, sku, price, stock. Include existing IDs to
            preserve them. Both arrays replace the existing collection on save.
            See API_CONTRACT.md for validation and inventory rules.
          </p>
        )}
        <MutationStatus mutation={mutation} />
        <button disabled={mutation.pending}>
          {mutation.pending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </section>
  );
}
export default function AdminPage() {
  const { resource = "products" } = useParams();
  if (!["products", "categories", "brands", "orders"].includes(resource))
    return (
      <div className="wrap page">
        <EmptyState
          title="Unknown management page"
          to="/admin/products"
          action="Manage products"
        />
      </div>
    );
  return <AdminResource key={resource} resource={resource} />;
}
function AdminResource({ resource }) {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [editing, setEditing] = useState(undefined),
    [deleting, setDeleting] = useState(null);
  const api = resourceApi(resource),
    query = useQuery(
      () =>
        api.list({
          page,
          search,
          ...(resource === "orders"
            ? { scope: "all" }
            : { include_inactive: true }),
        }),
      [page, search],
    ),
    mutation = useMutation();
  return (
    <div className="wrap page">
      <PageHeading title="Behind the good things." eyebrow="STORE MANAGEMENT" />
      <nav className="tabs">
        {["products", "categories", "brands", "orders"].map((r) => (
          <NavLink key={r} to={`/admin/${r}`}>
            {r}
          </NavLink>
        ))}
      </nav>
      <div className="results-toolbar">
        <Field
          label={`Search ${resource}`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        {resource !== "orders" && (
          <button onClick={() => setEditing(null)}>
            Create {resource.slice(0, -1)}
          </button>
        )}
      </div>
      {editing !== undefined && (
        <Editor
          key={editing?.id || "new"}
          resource={resource}
          current={editing}
          close={() => setEditing(undefined)}
          reload={query.reload}
        />
      )}
      <MutationStatus mutation={mutation} />
      {deleting && (
        <div className="error">
          <div>
            <strong>Delete {deleting.name}?</strong>
            <p>
              This action will be sent to the backend. Referenced products may
              be protected.
            </p>
            <div className="inline">
              <button
                disabled={mutation.pending}
                onClick={() =>
                  mutation.run(
                    () => api.remove(deleting.id),
                    () => {
                      setDeleting(null);
                      query.reload();
                    },
                  )
                }
              >
                Confirm deletion
              </button>
              <button className="secondary" onClick={() => setDeleting(null)}>
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
      <QueryState query={query}>
        {(data) => (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{resource === "orders" ? "Order" : "Name"}</th>
                    <th>Status</th>
                    <th>
                      {resource === "products"
                        ? "Price / stock"
                        : resource === "orders"
                          ? "Total"
                          : "Slug"}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.name || row.order_number}</td>
                      <td>
                        {row.order_status ||
                          (row.is_active ? "Active" : "Inactive")}
                      </td>
                      <td>
                        {resource === "products"
                          ? `${money(row.price)} / ${row.stock}`
                          : resource === "orders"
                            ? money(row.total)
                            : row.slug}
                      </td>
                      <td>
                        <div className="inline">
                          <button
                            className="text-button"
                            onClick={() => setEditing(row)}
                          >
                            Edit
                          </button>
                          {resource !== "orders" && (
                            <button
                              className="text-button"
                              onClick={() => setDeleting(row)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.results.length && (
              <EmptyState title={`No ${resource} found`} />
            )}
            <Pagination data={data} page={page} onChange={setPage} />
          </>
        )}
      </QueryState>
    </div>
  );
}
