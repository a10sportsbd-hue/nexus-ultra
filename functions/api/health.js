export async function onRequestGet({ env }) {
  return Response.json({
    success:true,
    service:"NEXUS ULTRA API",
    status:"online",
    database:Boolean(env.DB),
    timestamp:new Date().toISOString()
  },{headers:{"Cache-Control":"no-store"}});
}
