import React from "react";
import { Card } from "./Card";

export const Cards = ({ data, userData }) => {
  return (
    <div className="flex flex-col gap-4">
      {data
        ?.sort((a, b) => a.Aseguradora.localeCompare(b.Aseguradora))
        .map((element) => {
          return <Card data={element} userData={userData} />;
        })}
    </div>
  );
};
