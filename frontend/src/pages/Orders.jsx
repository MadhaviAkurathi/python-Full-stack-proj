import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { ordersApi } from "../api/services";
import { useQuery } from "../hooks/useQuery";
import {
  EmptyState,
  MutationStatus,
  PageHeading,
  Pagination,
  QueryState,
  useMutation,
} from "../components/UI";
import { AddressCard } from "./Account";
import { PriceSummary } from "./Shopping";
import { date, money } from "../utils/format";
export function OrdersPage() {
  const [page, setPage] = useState(1),
    query = useQuery(() => ordersApi.list({ page }), [page]);
  return (
    <div className="wrap page">
      <PageHeading title="Your finds, on their way." eyebrow="ORDER HISTORY" />
      <QueryState query={query}>
        {(data) => (
          <>
            {data.results.length ? (
              data.results.map((o) => (
                <Link
                  className="panel order-card"
                  to={`/orders/${o.id}`}
                  key={o.id}
                >
                  <div>
                    <span className="eyebrow">{o.order_number}</span>
                    <h3>{date(o.created_at)}</h3>
                  </div>
                  <span className="status-pill">{o.order_status}</span>
                  <span>
                    {o.items.length} items · {money(o.total)}
                  </span>
                  <ArrowRight size={20} />
                </Link>
              ))
            ) : (
              <EmptyState
                title="Your story starts with a first find."
                to="/products"
              />
            )}
            <Pagination data={data} page={page} onChange={setPage} />
          </>
        )}
      </QueryState>
    </div>
  );
}
export function OrderDetailPage({ success = false }) {
  const { id } = useParams(),
    query = useQuery(() => ordersApi.get(id), [id]),
    mutation = useMutation();
  return (
    <div className="wrap page">
      {success && (
        <div className="order-success">
          <CheckCircle2 size={40} />
          <span className="eyebrow">THANK YOU FOR SHOPPING WITH US</span>
          <h1>Good things are coming.</h1>
          <p>Your order has been created. Find the details below.</p>
        </div>
      )}
      <PageHeading
        title={success ? "Your order details." : "Every detail, right here."}
        eyebrow="YOUR ORDER"
      >
        <Link to="/orders">All orders</Link>
      </PageHeading>
      <MutationStatus mutation={mutation} />
      <QueryState query={query}>
        {(order) => (
          <div className="shopping-layout">
            <div>
              <div className="panel">
                <div className="section-heading">
                  <h2>{order.order_number}</h2>
                  <span className="status-pill">{order.order_status}</span>
                </div>
                <p>
                  Placed {date(order.created_at)} · Payment{" "}
                  {order.payment_status.toLowerCase()}
                </p>
                {order.items.map((item) => (
                  <div className="order-item" key={item.id}>
                    <div>
                      <h3>{item.product_name}</h3>
                      <small>
                        {item.sku} · {item.variant_name || "Standard"}
                      </small>
                      <p>
                        {item.quantity} × {money(item.unit_price)}
                      </p>
                    </div>
                    <strong>{money(item.total_price)}</strong>
                  </div>
                ))}
                <div className="inline">
                  {["PENDING", "CONFIRMED"].includes(order.order_status) && (
                    <button
                      className="secondary"
                      disabled={mutation.pending}
                      onClick={() =>
                        mutation.run(() => ordersApi.cancel(id), query.reload)
                      }
                    >
                      Cancel order
                    </button>
                  )}
                  {order.payment_method === "CARD_SIMULATION" &&
                    ["PENDING", "FAILED"].includes(order.payment_status) &&
                    order.order_status !== "CANCELLED" && (
                      <button
                        disabled={mutation.pending}
                        onClick={() =>
                          mutation.run(() => ordersApi.pay(id), query.reload)
                        }
                      >
                        Complete simulated payment
                      </button>
                    )}
                </div>
              </div>
              <h2>On its way to</h2>
              <AddressCard address={order.shipping_address} />
            </div>
            <PriceSummary cart={order} />
          </div>
        )}
      </QueryState>
    </div>
  );
}
