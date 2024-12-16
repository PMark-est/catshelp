import axios from "axios";

export const convertPartitionedNumberToContinous = (
  partitionedNumber: string
) => {
  // Split the string by '-' and join the parts together
  const continuousStr = partitionedNumber.split("-").join("");

  // Check if the last part has fewer than 3 digits
  /*const parts = partitionedNumber.split("-");
  if (parts[parts.length - 1].length !== 3) {
    console.warn("Warning: The last part does not have exactly 3 digits.");
  }*/

  return continuousStr;
};

export const getImages = async (catName: string) => {
  const images: string[] = await axios.get(
    `http://localhost:8080/pildid?nimi=${catName}`
  );
  return images;
};

export const getProfileInfo = (catName: string) => {
  return axios.get(`http://localhost:8080/kassid?nimi=${catName}`);
};

export const getAge = (birthDate: string) => {
  const today = new Date();
  const birth = new Date(birthDate);

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();

  //console.log([birthDate]);
  //console.log(birth);
  if (years === 0) return `${months} kuune`;

  // Adjust if the current month is before the birth month
  if (months < 0) {
    years--;
    months += 12;
  }

  if (months === 0) return `${years} aastane`;
  return `${years} aastane ja ${months} kuune`;
};

export const ageStringToDateString = (ageString: string): string => {
  const today = new Date();

  // Initialize years and months
  let years = 0;
  let months = 0;

  // Regular expressions to match the patterns
  const yearsMatch = ageString.match(/(\d+)\s+aastane?/);
  const monthsMatch = ageString.match(/(\d+)\s+kuune?/);

  // Extract years and months from the string
  if (yearsMatch) {
    years = parseInt(yearsMatch[1]);
  }
  if (monthsMatch) {
    months = parseInt(monthsMatch[1]);
  }

  // Calculate birth date
  const birthYear =
    today.getFullYear() - years - (months > today.getMonth() ? 1 : 0);
  const birthMonth = (today.getMonth() - months + 12) % 12; // wrap around if negative
  const birthDate = new Date(birthYear, birthMonth, today.getDate());

  // Format the date as YYYY-MM-DD
  const formattedDate = `${birthDate.getFullYear()}-${String(
    birthDate.getMonth() + 1
  ).padStart(2, "0")}-${String(birthDate.getDate()).padStart(2, "0")}`;

  return formattedDate;
};

// Viib kuupäeva kujul pp-kk-aaaa kujule aaaa-kk-pp
function convertDateFormat(dateStr: string) {
  if (dateStr === "") return "";
  // Split the input date string by the hyphen
  const [day, month, year] = dateStr.split("-");

  // Rearrange to the 'yyyy-mm-dd' format
  return `${year}-${month}-${day}`;
}

// Makes numbers more readable
export const formatChipNumber = (chipNumber: string) => {
  // Use regex to add hyphens every three digits
  return chipNumber.replace(/(\d{3})(?=\d)/g, "$1-");
};

export const getCatNameFromURL = (url: string) => {
  const lastSlashIndex = url.lastIndexOf("/");
  // If there's no slash, return the entire string; otherwise, return the substring after the last slash
  return lastSlashIndex === -1 ? url : url.substring(lastSlashIndex + 1);
};

export const dateToWords = (dateStr: string) => {
  // Array to map month numbers to words
  const months = [
    "Jaanuar",
    "Veebruar",
    "Märts",
    "Aprill",
    "Mai",
    "Juuni",
    "Juuli",
    "August",
    "September",
    "Oktoober",
    "November",
    "Detsember",
  ];

  // Parse the date string in the format yyyy-mm-dd
  const [year, month, day] = dateStr.split("-");

  if (!year || !month || !day) {
    return "Invalid date format. Please use yyyy-mm-dd.";
  }

  // Convert the day to an integer
  const dayInt = parseInt(day, 10);

  // Get the month name from the array (month is 1-based, so subtract 1)
  const monthName = months[parseInt(month, 10) - 1];

  // Return the formatted date
  return `${dayInt} ${monthName} ${year}`;
};

export const wordsToDate = (dateStr: string) => {
  // Map Estonian month names to their numeric values
  const monthMap: Record<string, string> = {
    jaanuar: "01",
    veebruar: "02",
    märts: "03",
    aprill: "04",
    mai: "05",
    juuni: "06",
    juuli: "07",
    august: "08",
    september: "09",
    oktoober: "10",
    november: "11",
    detsember: "12",
  };

  // Split the date string into parts
  const [day, monthEstonian, year] = dateStr.split(" ");

  // Get the numeric month from the map
  const monthNumeric = monthMap[monthEstonian.toLowerCase()];

  // Check if the month was found
  if (!monthNumeric) {
    throw new Error(`Invalid month: ${monthEstonian}`);
  }

  // Return the formatted date
  return `${year}-${monthNumeric}-${day.padStart(2, "0")}`;
};

export const uploadImages = async (files: File[], catName: string) => {
  const formData = new FormData();

  // Append each file to the FormData object
  files.forEach((file: File) => {
    formData.append("images", file); // Use the same key for all files, make sure it matches the multer key
  });
  try {
    const response = await axios.post(
      "http://localhost:8080/api/pilt/lisa",
      formData,
      {
        headers: {
          "Cat-Name": catName,
          "Content-Type": "multipart/form-data", // Set content type for file upload
        },
      }
    );
    console.log("Upload successful:", response.data);
  } catch (error) {
    console.error("Error uploading files:", error);
  }
};

export const changeInfo = (info: Object) => {
  return axios.put(`http://localhost:8080/kassid`, { info });
};

export const getNotices = (catName: string) => {
  return axios.get(`http://localhost:8080/teated?nimi=${catName}`);
};

export const getCats = () => {
  return axios.get("http://localhost:8080/kassid");
};

export const formatInput = (value: string): string => {
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, "");

  // Split the string into chunks of 3 digits and join with hyphens
  const formattedValue =
    digitsOnly
      .match(/.{1,3}/g) // This splits the digits into groups of 1 to 3
      ?.join("-") || ""; // Join the groups with hyphens, fallback to empty string if no match

  return formattedValue;
};

export const submitNewCatProfile = async (
  formData: {
    [k: string]: FormDataEntryValue;
  },
  pictures: File[]
) => {
  //formData.kiibi_nr = (formData.kiibi_nr as string).split("-").join("");
  //formData.synniaeg = convertDateFormat(formData.synniaeg as string);
  formData.leidmis_kp = convertDateFormat(formData.leidmis_kp as string);
  const catID = await axios.post(
    `${import.meta.env.VITE_BACKEND_URL}/api/animals`,
    formData
  );
  if (formData.nimi === "") {
    uploadImages(pictures, catID.data.id.toString());
  } else {
    uploadImages(pictures, formData.nimi as string);
  }
};
