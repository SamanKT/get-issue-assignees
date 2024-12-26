import axios from "axios";

export const generateBase64Credentials = (clientId, clientSecret) => {
  const credentials = `${clientId}:${clientSecret}`;
  console.log(btoa(credentials));
  return btoa(credentials); // Encodes the string to Base64
};

export const convertToJsonFormat = (data, model) => {
  let output = [];
  data.forEach((element) => {
    output.push({
      item: element,
      model: model,
    });
  });
  return output;
};
