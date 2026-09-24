export const pLang = [
  {
    type: "BasePanel",
    id: "surface-a",
    login: "SurfaceA",
    children: [{
      type: "SimplePanel",
      id: "surface-a-simple",
      login: "SurfaceASimple",
      children: [{
        type: "ActivePanel",
        id: "surface-a-active",
        login: "SurfaceAActive",
        children: [{
          type: "Container",
          id: "surface-a-message",
          login: "SurfaceAMessage",
          orientation: "Positive"
        }]
      }]
    }]
  },
  {
    type: "BasePanel",
    id: "surface-b",
    login: "SurfaceB",
    children: [{
      type: "SimplePanel",
      id: "surface-b-simple",
      login: "SurfaceBSimple",
      children: [{
        type: "ActivePanel",
        id: "surface-b-active",
        login: "SurfaceBActive",
        children: [{
          type: "Container",
          id: "surface-b-message",
          login: "SurfaceBMessage",
          orientation: "Positive"
        }]
      }]
    }]
  }
];
