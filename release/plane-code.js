export const planeCode = [
  {
    type: "BasePanel",
    id: "surface-a",
    name: "SurfaceA",
    children: [{
      type: "SimplePanel",
      id: "surface-a-simple",
      name: "SurfaceASimple",
      children: [{
        type: "ActivePanel",
        id: "surface-a-active",
        name: "SurfaceAActive",
        children: [{
          type: "Container",
          id: "surface-a-message",
          name: "SurfaceAMessage"
        }]
      }]
    }]
  },
  {
    type: "BasePanel",
    id: "surface-b",
    name: "SurfaceB",
    children: [{
      type: "SimplePanel",
      id: "surface-b-simple",
      name: "SurfaceBSimple",
      children: [{
        type: "ActivePanel",
        id: "surface-b-active",
        name: "SurfaceBActive",
        children: [{
          type: "Container",
          id: "surface-b-message",
          name: "SurfaceBMessage"
        }]
      }]
    }]
  }
];
