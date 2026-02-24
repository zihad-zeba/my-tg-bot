const axios = require("axios");
require("dotenv").config();

const API_TOKEN = process.env.WEBFLOW_API_TOKEN;
const COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID;

// Webflow API v2 Setup
const instance = axios.create({
  baseURL: "https://api.webflow.com/v2",
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Helper function for clear error logging
const handleError = (error, action) => {
  const errorMessage = error.response?.data?.message || error.response?.data || error.message;
  console.error(`[Error] Failed while ${action}:`, errorMessage);
  throw error;
};

// Get all items
async function getItems() {
  try {
    const res = await instance.get(`/collections/${COLLECTION_ID}/items`);
    console.log(res.data.items)
    return res.data.items;
  } catch (error) {
    handleError(error, "fetching items");
  }
}

// Create new LIVE item
async function createItem(data) {
  try {
    // API v2 uses specific /live endpoint
    const res = await instance.post(`/collections/${COLLECTION_ID}/items/live`, {
      isArchived: false,
      isDraft: false,
      fieldData: data // Using 'fieldData' instead of 'fields'
    });
    return res.data;
  } catch (error) {
    handleError(error, "creating item");
  }
}

// Update LIVE item
async function updateItem(itemId, data) {
  try {
    // API v2 uses specific /live endpoint for updates
    const res = await instance.patch(`/collections/${COLLECTION_ID}/items/${itemId}/live`, {
      isArchived: false,
      isDraft: false,
      fieldData: data
    });
    return res.data;
  } catch (error) {
    handleError(error, "updating item");
  }
}

// Delete item entirely from the collection
async function deleteItem(itemId) {
  try {
    const res = await instance.delete(`/collections/${COLLECTION_ID}/items/${itemId}`);
    return res.data;
  } catch (error) {
    handleError(error, "deleting item");
  }
}

module.exports = {
  getItems,
  createItem,
  updateItem,
  deleteItem,
};
