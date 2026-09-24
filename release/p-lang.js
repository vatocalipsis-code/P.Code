export const pLang = [
  {
    type: "BasePanel",
    id: "surface-a",
    Login: "SurfaceA",
    children: [{
      type: "SimplePanel",
      id: "surface-a-simple",
      Login: "SurfaceASimple",
      children: [{
        type: "ActivePanel",
        id: "surface-a-active",
        Login: "SurfaceAActive",
        children: [{
          type: "Container",
          id: "surface-a-message",
          Login: "SurfaceAMessage",
          Orientation: "Positive"
        }]
      }]
    }]
  },
  {
    type: "BasePanel",
    id: "surface-b",
    Login: "SurfaceB",
    children: [{
      type: "SimplePanel",
      id: "surface-b-simple",
      Login: "SurfaceBSimple",
      children: [{
        type: "ActivePanel",
        id: "surface-b-active",
        Login: "SurfaceBActive",
        children: [{
          type: "Container",
          id: "surface-b-message",
          Login: "SurfaceBMessage",
          Orientation: "Positive"
        }]
      }]
    }]
  }
];
