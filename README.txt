Quick Med Pune - online store + sales dashboard + inventory management

FILES
  index.html      the store (customers)
  style.css       store styling
  script.js       store logic (cart, WhatsApp order, UPI QR, stock)
  products.js     product list - edit names, prices and stock here (used by store AND dashboard)
  dashboard.html  sales dashboard (owner)
  dashboard.css   dashboard styling
  dashboard.js    dashboard logic and charts
  inventory.html  inventory management (owner)
  inventory.css   inventory styling
  inventory.js    inventory logic
  images/         product pictures (see below)

OPEN IT
Keep everything in one folder and open index.html. The dashboard has a button in the store header.
Orders sent from the store are saved in that browser and shown on the dashboard automatically.
Choose "Demo data" on the dashboard to preview it with sample orders.

IMPORTANT
Orders and stock are saved in the browser where the store is opened, so the dashboard only shows
orders placed in the same browser. For orders from customers' phones you need a small backend or
Google Sheet (ask for this as the next step). Do not share the dashboard link publicly.

CHANGE A PRODUCT IMAGE
Save your photo in images/ with the product's file name (.jpg, .png or .webp), e.g. images/paracetamol.jpg.
Names: paracetamol cetirizine coughsyrup ors antacid multivit painrelief antiseptic bandages thermometer metformin amoxicillin

SETTINGS
In script.js, change DEF near the top: store name, WhatsApp number (91XXXXXXXXXX), UPI ID.
Add your Drug Licence number in the footer text in script.js.

INVENTORY (inventory.html)
  - Stock per location (Main Store, Godown; add more), with total and status (In stock / Low / Out).
  - Alerts: banner at the top and the tab title show how many items need attention.
  - SKU and barcode for every product (EAN-13 generated, editable). Print barcode labels.
  - Scan box: scan a barcode (USB scanner types the code + Enter) or type a SKU to open that product.
  - Suppliers and purchase orders: create orders, auto-fill low-stock items, send the order on
    WhatsApp, and mark Received to add the stock to a location.
  - Online sync: locations marked "Sells online" feed the store's stock. Orders from the store reduce
    inventory automatically (shown as "Online order" in the movements list).
  - Reorder level and cost price are set per product with the Edit button.
  Data is saved in this browser. Back up with Export stock (CSV).
