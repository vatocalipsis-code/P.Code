export const planeCode = [
  {
    type: "BasePanel",
    id: "surface-a",
    children: [{
      type: "SimplePanel",
      id: "surface-a-simple",
      children: [{
        type: "ActivePanel",
        id: "surface-a-active",
        children: [{ type: "Container", id: "surface-a-message" }]
      }]
    }]
  },
  {
    type: "BasePanel",
    id: "surface-b",
    children: [{
      type: "SimplePanel",
      id: "surface-b-simple",
      children: [{
        type: "ActivePanel",
        id: "surface-b-active",
        children: [{ type: "Container", id: "surface-b-message" }]
      }]
    }]
  }
];
