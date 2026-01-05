/**
 * controllers/paymentController.js (Advanced Flow)
 *
 * Handles the full, two-stage payment process with temporary storage.
 */
import jsSHA from "jssha";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises"; // Using promise-based fs for async operations
import ITR from "../models/ITR.js";
import Service from "../models/Service.js";
import TemporaryTransaction from "../models/TemporaryTransaction.js";

// --- STAGE 1: Initiate Payment after Uploading Files Temporarily (Corrected) ---
export const initiateITRWithUpload = async (req, res) => {
  try {
    // 1. Validate form data and files
    const { aadharCardNo, panCardNo, accountNo, ifscCode } = req.body;
    const { aadharFile, panCardFile, passbookFile } = req.files || {};

    if (
      !aadharCardNo ||
      !panCardNo ||
      !accountNo ||
      !ifscCode ||
      !aadharFile ||
      !panCardFile ||
      !passbookFile
    ) {
      return res
        .status(400)
        .json({ message: "All fields and documents are required." });
    }

    const amount = 2;
    const txnid = uuidv4();
    const uploadDir = path.join(process.cwd(), "uploads");

    // 2. Save files to a TEMPORARY directory
    const tempDir = path.join(uploadDir, "temp", txnid);
    await fs.mkdir(tempDir, { recursive: true });

    const saveFile = async (file, fieldName) => {
      const tempFileName = `${fieldName}_${Date.now()}${path.extname(
        file.name
      )}`;
      const tempFilePath = path.join(tempDir, tempFileName);
      await file.mv(tempFilePath);
      return tempFilePath;
    };

    const tempAadharPath = await saveFile(aadharFile, "aadhar");
    const tempPanPath = await saveFile(panCardFile, "pancard");
    const tempPassbookPath = await saveFile(passbookFile, "passbook");

    // 3. Create a record in the TemporaryTransaction collection
    await TemporaryTransaction.create({
      txnid,
      userId: req.user.id,
      itrData: { aadharCardNo, panCardNo, accountNo, ifscCode },
      tempFilePaths: {
        aadharFile: tempAadharPath,
        panCardFile: tempPanPath,
        passbookFile: tempPassbookPath,
      },
      amount,
    });

    // 4. Prepare PayU data
    const merchantKey = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;
    const payUData = {
      key: merchantKey,
      txnid,
      amount,
      productinfo: "ITR Filing Service",
      firstname: req.user.name || "", // Use empty string if name is undefined/null
      email: req.user.email || "", // Use empty string if email is undefined/null
      phone: req.user.phone || "9999999999",
      surl: `${process.env.BACKEND_URL}/api/payment/itr-callback`,
      furl: `${process.env.BACKEND_URL}/api/payment/itr-callback`,
      udf1: "", // Explicitly set unused fields to empty
      udf2: "",
      udf3: "",
      udf4: "",
      udf5: "",
    };

    // --- THIS IS THE CORRECTED LINE ---
    // The hash string must match the exact order and include empty placeholders for unused fields.
    // The corrected hash string generation
    const hashString = `${payUData.key}|${payUData.txnid}|${payUData.amount}|${payUData.productinfo}|${payUData.firstname}|${payUData.email}|${payUData.udf1}|${payUData.udf2}|${payUData.udf3}|${payUData.udf4}|${payUData.udf5}||||||${salt}`;

    const sha = new jsSHA("SHA-512", "TEXT");
    sha.update(hashString);
    payUData.hash = sha.getHash("HEX");

    // 5. Send PayU data to frontend
    res.status(200).json(payUData);
  } catch (error) {
    console.error("Payment initiation with upload failed:", error);
    res
      .status(500)
      .json({ message: "Server error during payment initiation." });
  }
};

// --- STAGE 2: Handle PayU Callback and Finalize Service Creation ---
export const itrPaymentCallback = async (req, res) => {
  const { status, txnid, amount, firstname, email, productinfo, hash } =
    req.body;
  const salt = process.env.PAYU_MERCHANT_SALT;
  const merchantKey = process.env.PAYU_MERCHANT_KEY;

  //   // 1. Verify the hash from PayU
  //   const responsePayload = req.body;

  //   const hashString = `${salt}|${responsePayload.status}||||||||||${responsePayload.email}|${responsePayload.firstname}|${responsePayload.productinfo}|${responsePayload.amount}|${responsePayload.txnid}|${merchantKey}`;

  // 1. Verify the hash from PayU using the CORRECT response formula
  // The formula is: salt|status|||||||||||email|firstname|productinfo|amount|txnid|key
  const hashString = `${salt}|${status}|||||||||||${email || ""}|${
    firstname || ""
  }|${productinfo || ""}|${amount || ""}|${txnid || ""}|${merchantKey}`;

  const sha = new jsSHA("SHA-512", "TEXT");
  sha.update(hashString);
  const calculatedHash = sha.getHash("HEX");

  console.log("Received hash:", hash);
  console.log("Calculated hash:", calculatedHash);
  console.log("Hash string used:", hashString);

  if (calculatedHash !== hash) {
    console.error("Hash verification failed");
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-status?status=error&message=Invalid_Transaction_Hash`
    );
  }

  // 2. Find the temporary transaction record
  const tempTransaction = await TemporaryTransaction.findOne({ txnid });
  if (!tempTransaction) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-status?status=error&message=Transaction_Not_Found`
    );
  }

  if (status !== "success") {
    // If payment failed, delete the temp files and directory
    await fs.rm(path.dirname(tempTransaction.tempFilePaths.aadharFile), {
      recursive: true,
      force: true,
    });
    await TemporaryTransaction.deleteOne({ txnid });
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-status?status=failure&txnid=${txnid}`
    );
  }

  // --- PAYMENT IS VERIFIED AND SUCCESSFUL ---
  try {
    // 3. Move files from temporary to permanent location
    const finalDir = path.join(process.cwd(), "uploads", "itr");
    await fs.mkdir(finalDir, { recursive: true });

    const moveFile = async (tempPath) => {
      const fileName = path.basename(tempPath);
      const finalPath = path.join(finalDir, fileName);
      await fs.rename(tempPath, finalPath);
      return `/uploads/itr/${fileName}`; // Return the public-facing path
    };

    const finalAadharPath = await moveFile(
      tempTransaction.tempFilePaths.aadharFile
    );
    const finalPanPath = await moveFile(
      tempTransaction.tempFilePaths.panCardFile
    );
    const finalPassbookPath = await moveFile(
      tempTransaction.tempFilePaths.passbookFile
    );

    // 4. Create the final ITR and Service documents
    const specificService = await ITR.create({
      user: tempTransaction.userId,
      ...tempTransaction.itrData,
      aadharFile: finalAadharPath,
      panCardFile: finalPanPath,
      passbookFile: finalPassbookPath,
    });

    await Service.create({
      user: tempTransaction.userId,
      serviceType: "ITR",
      specificService: specificService._id,
      status: "in_progress",
    });

    // 5. Clean up: delete the temporary directory and the temporary transaction record
    await fs.rm(path.dirname(tempTransaction.tempFilePaths.aadharFile), {
      recursive: true,
      force: true,
    });
    await TemporaryTransaction.deleteOne({ txnid });

    // 6. Redirect to frontend success page
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-status?status=success&txnid=${txnid}`
    );
  } catch (dbError) {
    console.error("DB Error after successful payment:", dbError);
    // This is a critical error. The user has paid but the service was not created.
    // You should log this thoroughly for manual intervention.
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-status?status=error&message=Service_Creation_Failed_Please_Contact_Support&txnid=${txnid}`
    );
  }
};
