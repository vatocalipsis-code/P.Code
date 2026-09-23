export const planeCode = [
  {
    type: "BasePanel",
    id: "home",
    children: [
      {
        type: "SimplePanel",
        id: "home-simple",
        children: [
          {
            type: "ActivePanel",
            id: "home-active",
            children: [{ type: "Container", id: "home-message" }]
          }
        ]
      }
    ]
  },
  {
    type: "BasePanel",
    id: "menu",
    children: [
      {
        type: "SimplePanel",
        id: "menu-simple",
        children: [
          {
            type: "ActivePanel",
            id: "menu-active",
            children: [{ type: "Container", id: "menu-message" }]
          }
        ]
      }
    ]
  }
];
