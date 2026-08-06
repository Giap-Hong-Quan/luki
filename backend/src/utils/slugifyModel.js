import slugify from "slugify";

export const slugifyModel = (str) => {
    if (!str || typeof str !== "string") return "";
    return slugify(str, {
        replacement: "-", 
        lower: true,
        strict: true,     
        locale: "vi",     
        trim: true        
    });
};

export default slugifyModel;
