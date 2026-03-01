FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

COPY ["coordina/coordina.csproj", "coordina/"]
RUN dotnet restore "coordina/coordina.csproj"

COPY . .
WORKDIR "/app/coordina"
RUN dotnet build "coordina.csproj" -c Release -o /app/build
FROM build AS publish
RUN dotnet publish "coordina.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "coordina.dll"]
