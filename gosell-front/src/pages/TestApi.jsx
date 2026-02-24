import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";

export default function TestApi() {
    const [data, setData] = useState(null);

    useEffect(() => {
        apiRequest("/type_produit")
            .then(setData)
            .catch(console.error);
    }, []);

    return (
        <div>
            <h1>Test API</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}