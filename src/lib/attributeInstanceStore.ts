import type { AttributeTemplateScope } from "@/lib/attributeTemplateStore";

type AttributeInstanceStore = Record<string, Record<string, string>>;

const STORAGE_KEY = "plant-attribute-instance-values-v1";
export const ATTRIBUTE_INSTANCE_CHANGE_EVENT =
  "attribute-instance-values-changed";

function buildInstanceKey(scope: AttributeTemplateScope, objectId: number) {
  return `${scope}:${objectId}`;
}

function loadStore(): AttributeInstanceStore {
  if (typeof window === "undefined") return {};

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};

  try {
    return JSON.parse(stored) as AttributeInstanceStore;
  } catch {
    return {};
  }
}

export function loadAttributeInstanceValues(
  scope: AttributeTemplateScope,
  objectId: number,
) {
  return loadStore()[buildInstanceKey(scope, objectId)] || {};
}

export function saveAttributeInstanceValues(
  scope: AttributeTemplateScope,
  objectId: number,
  values: Record<string, string>,
) {
  if (typeof window === "undefined") return;

  const store = loadStore();
  store[buildInstanceKey(scope, objectId)] = values;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(
    new CustomEvent(ATTRIBUTE_INSTANCE_CHANGE_EVENT, {
      detail: { scope, objectId },
    }),
  );
}
