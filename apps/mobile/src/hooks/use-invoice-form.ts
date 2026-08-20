import { useCallback, useMemo, useReducer, useRef } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import {
  calculateInvoiceTotal,
  centsToDollars,
  dollarsToCents,
  parseDecimalQuantity,
} from "@repo/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DraftLineItem = {
  localId: string;
  name: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxable: boolean;
};

type DraftFormState = {
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  lineItems: DraftLineItem[];
  expenseIds: string[];
  discountEnabled: boolean;
  discountType: "percentage" | "fixed";
  discountValue: string;
  taxRate: string;
  dueDate: number | null;
  errors: Record<string, string>;
  isSaving: boolean;
};

type Action =
  | { type: "SET_CLIENT"; id: string; name: string; email: string }
  | { type: "CLEAR_CLIENT" }
  | { type: "ADD_LINE_ITEM" }
  | {
      type: "UPDATE_LINE_ITEM";
      localId: string;
      field: string;
      value: string | boolean;
    }
  | { type: "REMOVE_LINE_ITEM"; localId: string }
  | {
      type: "INSERT_PRESET";
      preset: {
        name: string;
        description?: string;
        defaultPrice: number;
        taxable: boolean;
      };
    }
  | { type: "SET_EXPENSES"; ids: string[] }
  | { type: "TOGGLE_DISCOUNT" }
  | { type: "SET_DISCOUNT_TYPE"; discountType: "percentage" | "fixed" }
  | { type: "SET_DISCOUNT_VALUE"; value: string }
  | { type: "SET_TAX_RATE"; value: string }
  | { type: "SET_DUE_DATE"; date: number | null }
  | { type: "SET_ERRORS"; errors: Record<string, string> }
  | { type: "CLEAR_ERRORS" }
  | { type: "SET_SAVING"; isSaving: boolean }
  | { type: "INIT_FROM_INVOICE"; invoice: ExistingInvoice };

type ExistingInvoice = {
  _id: string;
  lineItems: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxable: boolean;
  }>;
  clientSnapshot?: { name: string; email: string; phone?: string };
  expenses: Array<{ id: string; description: string; amount: number }>;
  discount?: { type: "percentage" | "fixed"; value: number } | null;
  tax?: { rate: number };
  dueDate?: number;
};

export type UseInvoiceFormOptions = {
  orgId: string;
  existingInvoice?: ExistingInvoice;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyLineItem(): DraftLineItem {
  return {
    localId: crypto.randomUUID(),
    name: "",
    description: "",
    quantity: "1",
    unitPrice: "",
    taxable: false,
  };
}

const initialState: DraftFormState = {
  clientId: null,
  clientName: null,
  clientEmail: null,
  lineItems: [createEmptyLineItem()],
  expenseIds: [],
  discountEnabled: false,
  discountType: "percentage",
  discountValue: "",
  taxRate: "",
  dueDate: null,
  errors: {},
  isSaving: false,
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function reducer(state: DraftFormState, action: Action): DraftFormState {
  switch (action.type) {
    case "SET_CLIENT":
      return {
        ...state,
        clientId: action.id,
        clientName: action.name,
        clientEmail: action.email,
        errors: removeError(state.errors, "client"),
      };

    case "CLEAR_CLIENT":
      return {
        ...state,
        clientId: null,
        clientName: null,
        clientEmail: null,
      };

    case "ADD_LINE_ITEM":
      return {
        ...state,
        lineItems: [...state.lineItems, createEmptyLineItem()],
        errors: removeError(state.errors, "lineItems"),
      };

    case "UPDATE_LINE_ITEM":
      return {
        ...state,
        lineItems: state.lineItems.map((item) =>
          item.localId === action.localId
            ? { ...item, [action.field]: action.value }
            : item,
        ),
        errors: removeErrorsForItem(state.errors, action.localId),
      };

    case "REMOVE_LINE_ITEM":
      return {
        ...state,
        lineItems: state.lineItems.filter(
          (item) => item.localId !== action.localId,
        ),
        errors: removeErrorsForItem(state.errors, action.localId),
      };

    case "INSERT_PRESET":
      return {
        ...state,
        lineItems: [
          ...state.lineItems,
          {
            localId: crypto.randomUUID(),
            name: action.preset.name,
            description: action.preset.description ?? "",
            quantity: "1",
            unitPrice: centsToDollars(action.preset.defaultPrice).toFixed(2),
            taxable: action.preset.taxable,
          },
        ],
        errors: removeError(state.errors, "lineItems"),
      };

    case "SET_EXPENSES":
      return { ...state, expenseIds: action.ids };

    case "TOGGLE_DISCOUNT":
      return {
        ...state,
        discountEnabled: !state.discountEnabled,
        discountValue: state.discountEnabled ? "" : state.discountValue,
      };

    case "SET_DISCOUNT_TYPE":
      return { ...state, discountType: action.discountType, discountValue: "" };

    case "SET_DISCOUNT_VALUE":
      return { ...state, discountValue: action.value };

    case "SET_TAX_RATE":
      return { ...state, taxRate: action.value };

    case "SET_DUE_DATE":
      return { ...state, dueDate: action.date };

    case "SET_ERRORS":
      return { ...state, errors: action.errors };

    case "CLEAR_ERRORS":
      return { ...state, errors: {} };

    case "SET_SAVING":
      return { ...state, isSaving: action.isSaving };

    case "INIT_FROM_INVOICE": {
      const inv = action.invoice;
      return {
        ...state,
        clientId: null, // snapshot only; user must re-select to change
        clientName: inv.clientSnapshot?.name ?? null,
        clientEmail: inv.clientSnapshot?.email ?? null,
        lineItems: inv.lineItems.map((item) => ({
          localId: crypto.randomUUID(),
          name: item.name,
          description: item.description ?? "",
          quantity: String(item.quantity),
          unitPrice: centsToDollars(item.unitPrice).toFixed(2),
          taxable: item.taxable,
        })),
        expenseIds: inv.expenses.map((e) => e.id),
        discountEnabled: inv.discount != null,
        discountType: inv.discount?.type ?? "percentage",
        discountValue:
          inv.discount != null
            ? inv.discount.type === "fixed"
              ? centsToDollars(inv.discount.value).toFixed(2)
              : String(inv.discount.value)
            : "",
        taxRate: inv.tax != null ? String(inv.tax.rate) : "",
        dueDate: inv.dueDate ?? null,
        errors: {},
        isSaving: false,
      };
    }

    default:
      return state;
  }
}

function removeError(
  errors: Record<string, string>,
  key: string,
): Record<string, string> {
  if (!(key in errors)) return errors;
  const next = { ...errors };
  delete next[key];
  return next;
}

function removeErrorsForItem(
  errors: Record<string, string>,
  localId: string,
): Record<string, string> {
  const prefix = `lineItem_${localId}_`;
  const keys = Object.keys(errors).filter((k) => k.startsWith(prefix));
  if (keys.length === 0) return errors;
  const next = { ...errors };
  for (const k of keys) delete next[k];
  return next;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useInvoiceForm({ orgId, existingInvoice }: UseInvoiceFormOptions) {
  const router = useRouter();
  const createInvoice = useMutation(api.invoices.create);
  const updateInvoice = useMutation(api.invoices.update);

  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from existing invoice exactly once
  const hasHydrated = useRef(false);
  if (existingInvoice && !hasHydrated.current) {
    hasHydrated.current = true;
    dispatch({ type: "INIT_FROM_INVOICE", invoice: existingInvoice });
  }

  // ---------------------------------------------------------------------------
  // Derived totals
  // ---------------------------------------------------------------------------

  const totals = useMemo(() => {
    const parsedItems = state.lineItems.map((item) => ({
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: dollarsToCents(parseFloat(item.unitPrice) || 0),
      taxable: item.taxable,
    }));

    const discount = state.discountEnabled
      ? {
          type: state.discountType,
          value:
            state.discountType === "fixed"
              ? dollarsToCents(parseFloat(state.discountValue) || 0)
              : parseFloat(state.discountValue) || 0,
        }
      : null;

    const taxRate = parseFloat(state.taxRate) || 0;

    return calculateInvoiceTotal({ lineItems: parsedItems, discount, taxRate });
  }, [
    state.lineItems,
    state.discountEnabled,
    state.discountType,
    state.discountValue,
    state.taxRate,
  ]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validate = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (state.clientId === null) {
      errors.client = "A client is required.";
    }

    if (state.lineItems.length === 0) {
      errors.lineItems = "At least one line item is required.";
    }

    for (const item of state.lineItems) {
      if (item.name.trim().length === 0) {
        errors[`lineItem_${item.localId}_name`] = "Name is required.";
      }

      try {
        const qty = parseDecimalQuantity(item.quantity);
        if (qty <= 0) {
          errors[`lineItem_${item.localId}_quantity`] =
            "Quantity must be greater than 0.";
        }
      } catch {
        errors[`lineItem_${item.localId}_quantity`] = "Invalid quantity.";
      }

      const priceParsed = parseFloat(item.unitPrice);
      if (Number.isNaN(priceParsed) || dollarsToCents(priceParsed) < 0) {
        errors[`lineItem_${item.localId}_unitPrice`] = "Invalid unit price.";
      }
    }

    return errors;
  }, [state.clientId, state.lineItems]);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const save = useCallback(async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      dispatch({ type: "SET_ERRORS", errors });
      return;
    }

    dispatch({ type: "SET_SAVING", isSaving: true });
    dispatch({ type: "CLEAR_ERRORS" });

    try {
      const parsedLineItems = state.lineItems.map((item) => ({
        name: item.name.trim(),
        description: item.description.trim() || undefined,
        quantity: parseDecimalQuantity(item.quantity),
        unitPrice: dollarsToCents(parseFloat(item.unitPrice) || 0),
        taxable: item.taxable,
      }));

      const discount = state.discountEnabled
        ? {
            type: state.discountType,
            value:
              state.discountType === "fixed"
                ? dollarsToCents(parseFloat(state.discountValue) || 0)
                : parseFloat(state.discountValue) || 0,
          }
        : null;

      const taxRate = parseFloat(state.taxRate) || 0;
      const dueDate = state.dueDate ?? undefined;

      if (existingInvoice) {
        await updateInvoice({
          invoiceId: existingInvoice._id as Id<"invoices">,
          clientId: state.clientId as Id<"clients"> | undefined,
          lineItems: parsedLineItems,
          expenses: state.expenseIds.length > 0
            ? (state.expenseIds as Id<"expenses">[])
            : undefined,
          discount,
          taxRate,
          dueDate,
        });
      } else {
        await createInvoice({
          orgId: orgId as Id<"organizations">,
          clientId: state.clientId as Id<"clients">,
          lineItems: parsedLineItems,
          expenses: state.expenseIds.length > 0
            ? (state.expenseIds as Id<"expenses">[])
            : undefined,
          discount,
          taxRate,
          dueDate,
        });
      }

      router.back();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      dispatch({ type: "SET_ERRORS", errors: { save: message } });
    } finally {
      dispatch({ type: "SET_SAVING", isSaving: false });
    }
  }, [
    validate,
    state,
    existingInvoice,
    orgId,
    createInvoice,
    updateInvoice,
    router,
  ]);

  // ---------------------------------------------------------------------------
  // Dispatch wrappers
  // ---------------------------------------------------------------------------

  const setClient = useCallback(
    (id: string, name: string, email: string) =>
      dispatch({ type: "SET_CLIENT", id, name, email }),
    [],
  );

  const clearClient = useCallback(
    () => dispatch({ type: "CLEAR_CLIENT" }),
    [],
  );

  const addLineItem = useCallback(
    () => dispatch({ type: "ADD_LINE_ITEM" }),
    [],
  );

  const updateLineItem = useCallback(
    (localId: string, field: string, value: string | boolean) =>
      dispatch({ type: "UPDATE_LINE_ITEM", localId, field, value }),
    [],
  );

  const removeLineItem = useCallback(
    (localId: string) => dispatch({ type: "REMOVE_LINE_ITEM", localId }),
    [],
  );

  const insertPreset = useCallback(
    (preset: {
      name: string;
      description?: string;
      defaultPrice: number;
      taxable: boolean;
    }) => dispatch({ type: "INSERT_PRESET", preset }),
    [],
  );

  const setExpenses = useCallback(
    (ids: string[]) => dispatch({ type: "SET_EXPENSES", ids }),
    [],
  );

  const toggleDiscount = useCallback(
    () => dispatch({ type: "TOGGLE_DISCOUNT" }),
    [],
  );

  const setDiscountType = useCallback(
    (discountType: "percentage" | "fixed") =>
      dispatch({ type: "SET_DISCOUNT_TYPE", discountType }),
    [],
  );

  const setDiscountValue = useCallback(
    (value: string) => dispatch({ type: "SET_DISCOUNT_VALUE", value }),
    [],
  );

  const setTaxRate = useCallback(
    (value: string) => dispatch({ type: "SET_TAX_RATE", value }),
    [],
  );

  const setDueDate = useCallback(
    (date: number | null) => dispatch({ type: "SET_DUE_DATE", date }),
    [],
  );

  return {
    state,
    totals,
    setClient,
    clearClient,
    addLineItem,
    updateLineItem,
    removeLineItem,
    insertPreset,
    setExpenses,
    toggleDiscount,
    setDiscountType,
    setDiscountValue,
    setTaxRate,
    setDueDate,
    save,
  };
}

export type UseInvoiceFormReturn = ReturnType<typeof useInvoiceForm>;
