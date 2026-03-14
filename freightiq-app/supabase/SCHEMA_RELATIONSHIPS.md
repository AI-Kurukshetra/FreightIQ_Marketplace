# FreightIQ Schema Relationships

## SRS Analysis Summary

The SRS defines the correct MVP domain entities, but it leaves a few operational gaps:

- `Sustainability Manager` is a persona, not a separate stored role.
- `shipments.status` needed alignment with the load lifecycle.
- admin-level access was not defined in the original RLS set.
- the marketplace flow needed a constraint to prevent multiple active shipments for one load.

For the MVP, the database should operate on three roles:

- `shipper`
- `carrier`
- `admin`

## Tables

| Table | Purpose | Primary Key |
|---|---|---|
| `profiles` | Auth-linked user profile and application role | `id` |
| `loads` | Freight requests created by shippers | `id` |
| `carriers` | Carrier company/fleet record owned by a carrier user | `id` |
| `shipments` | Matched execution record between a load and a carrier | `id` |
| `co2_records` | Carbon accounting per shipment | `id` |
| `modal_comparisons` | Multi-mode benchmark per load | `id` |

## Relationships

| From Table | Column | To Table | Cardinality | Notes |
|---|---|---|---|---|
| `profiles` | `id` | `auth.users.id` | 1:1 | App profile mirrors the Supabase auth user |
| `loads` | `shipper_id` | `profiles.id` | many:1 | One shipper can create many loads |
| `carriers` | `owner_id` | `profiles.id` | 1:1 for MVP | One carrier user owns one carrier record |
| `shipments` | `load_id` | `loads.id` | many:1, constrained to one active shipment per load | A load may be re-matched only after cancellation |
| `shipments` | `carrier_id` | `carriers.id` | many:1 | One carrier can handle many shipments |
| `co2_records` | `shipment_id` | `shipments.id` | many:1 | Carbon data belongs to a shipment |
| `co2_records` | `shipper_id` | `profiles.id` | many:1 | Used for shipper-facing reporting and RLS |
| `modal_comparisons` | `load_id` | `loads.id` | 1:1 | One modal comparison row per load |

## Lifecycle Notes

- `loads.status`: `open`, `matched`, `in_transit`, `delivered`, `cancelled`
- `shipments.status`: `matched`, `picked_up`, `in_transit`, `delivered`, `cancelled`
- A trigger syncs shipment status changes back to the parent load.

## Migration Notes

The follow-up migration `20260314_0005_mvp_schema_hardening.sql` adds:

- admin helper function for RLS
- one-carrier-per-owner uniqueness
- one-active-shipment-per-load protection
- normalized shipment statuses
- shipment-to-load status sync trigger
- admin access policies
- carrier shipment creation policy for open loads
