import cors from "cors";

const corsOptions = {
  origin: "*", // Customize this to allow specific domains if necessary
  methods: ["GET", "POST", "PUT", "DELETE"],
};

export default cors(corsOptions);
