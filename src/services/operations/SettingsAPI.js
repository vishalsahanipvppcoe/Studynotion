import { toast } from "react-hot-toast";

import { setUser } from "../../slices/profileSlice";
import { apiConnector } from "../apiconnector";
import { settingsEndpoints } from "../apis";
import { logout } from "./authAPI";

const {
  UPDATE_DISPLAY_PICTURE_API,
  UPDATE_PROFILE_API,
  CHANGE_PASSWORD_API,
  DELETE_PROFILE_API,
} = settingsEndpoints;

export function updateDisplayPicture(token, formData) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");

    try {
      const response = await apiConnector(
        "PUT",
        UPDATE_DISPLAY_PICTURE_API,
        formData,
        {
          Authorization: `Bearer ${token}`,
        },
      );

      console.log("UPDATE_DISPLAY_PICTURE_API RESPONSE:", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      const userData = response.data.data;

      if (!userData) {
        throw new Error("No user data returned from server");
      }

      dispatch(setUser(userData));

      toast.success("Display Picture Updated Successfully");
    } catch (error) {
      console.log("UPDATE_DISPLAY_PICTURE_API ERROR:", error);
      toast.error("Could Not Update Display Picture");
    }

    toast.dismiss(toastId);
  };
}

export function updateProfile(token, formData) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    try {
      const response = await apiConnector("PUT", UPDATE_PROFILE_API, formData, {
        Authorization: `Bearer ${token}`,
      });

      console.log("UPDATE_PROFILE_API RESPONSE:", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      const userData = response.data.data; // ✅ FIXED HERE

      const userImage = userData.image
        ? userData.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${userData.firstName} ${userData.lastName}`;

      dispatch(setUser({ ...userData, image: userImage }));

      toast.success("Profile Updated Successfully");
    } catch (error) {
      console.log("UPDATE_PROFILE_API ERROR:", error);
      toast.error("Could Not Update Profile");
    }
    toast.dismiss(toastId);
  };
}

export async function changePassword(token, formData) {
  const toastId = toast.loading("Loading...");
  try {
    const response = await apiConnector("POST", CHANGE_PASSWORD_API, formData, {
      Authorization: `Bearer ${token}`,
    });
    console.log("CHANGE_PASSWORD_API API RESPONSE............", response);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    toast.success("Password Changed Successfully");
  } catch (error) {
    console.log("CHANGE_PASSWORD_API API ERROR............", error);
    toast.error(error.response.data.message);
  }
  toast.dismiss(toastId);
}

export function deleteProfile(token, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    try {
      const response = await apiConnector("DELETE", DELETE_PROFILE_API, null, {
        Authorization: `Bearer ${token}`,
      });
      console.log("DELETE_PROFILE_API API RESPONSE............", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      toast.success("Profile Deleted Successfully");
      dispatch(logout(navigate));
    } catch (error) {
      console.log("DELETE_PROFILE_API API ERROR............", error);
      toast.error("Could Not Delete Profile");
    }
    toast.dismiss(toastId);
  };
}
