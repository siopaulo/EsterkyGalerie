import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { serverEnv } from "@/lib/env";

let configured = false;

function configure() {
  if (configured) return;
  const { cloudName, apiKey, apiSecret } = serverEnv.cloudinary;
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

export function signUpload(params: Record<string, string | number>) {
  configure();
  const timestamp = Math.floor(Date.now() / 1000);
  const { apiSecret, apiKey, cloudName, folder } = serverEnv.cloudinary;
  const paramsToSign = {
    folder,
    timestamp,
    ...params,
  };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
  };
}

export async function deleteFromCloudinary(publicId: string) {
  configure();
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (err) {
    console.error("[cloudinary] destroy failed", publicId, err);
  }
}

export async function getResourceMeta(publicId: string) {
  configure();
  return cloudinary.api.resource(publicId);
}
